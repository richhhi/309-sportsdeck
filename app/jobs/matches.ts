import 'dotenv/config';
import { prisma } from "../../lib/prisma";
import { MatchesResponse, Match as ApiMatch } from './interfaces';


const API_KEY = process.env.FOOTBALL_DATA_API_TOKEN;
const BASE_URL = 'https://api.football-data.org/v4';

export async function fetchAndSyncPremierLeagueMatches(): Promise<void> {
  // First window: March 21 to March 28
  const mar21 = new Date();
  mar21.setMonth(2); // March
  mar21.setDate(21);
  const mar21End = new Date(mar21);
  mar21End.setDate(mar21.getDate() + 7);

  // Second window: April 11 to April 18
  const apr11 = new Date();
  apr11.setMonth(3); // April
  apr11.setDate(11);
  const apr11End = new Date(apr11);
  apr11End.setDate(apr11.getDate() + 7);

  const url1 = `${BASE_URL}/matches?dateFrom=${getFormattedDate(mar21)}&dateTo=${getFormattedDate(mar21End)}`;
  const url2 = `${BASE_URL}/matches?dateFrom=${getFormattedDate(apr11)}&dateTo=${getFormattedDate(apr11End)}`;

  try {
    const fetchMatches = async (url: string) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Auth-Token': API_KEY ?? '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: MatchesResponse = await response.json();
      return data.matches.filter(match => match.competition.code === 'PL');
    };

    const matches1 = await fetchMatches(url1);
    const matches2 = await fetchMatches(url2);
    const plMatches = [...matches1, ...matches2];

    // Sync matches to database
    for (const match of plMatches) {
      await syncMatchToDatabase(match);
    }

    console.log(`Successfully synced ${plMatches.length} Premier League matches`);
  } catch (error) {
    console.error('Failed to fetch and sync matches:', error);
    throw error;
  }
}

async function syncMatchToDatabase(apiMatch: ApiMatch): Promise<void> {
  try {
    // Find teams by external ID
    const homeTeam = await prisma.team.findUnique({
      where: { externalId: apiMatch.homeTeam.id },
    });

    const awayTeam = await prisma.team.findUnique({
      where: { externalId: apiMatch.awayTeam.id },
    });

    if (!homeTeam || !awayTeam) {
      console.warn(`Teams not found for match ${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`);
      return;
    }

    // Create or find matchday
    const matchday = await prisma.matchday.create({
      data: {
        name: `Matchday ${apiMatch.matchday}`,
        startDate: new Date(apiMatch.utcDate),
        endDate: new Date(apiMatch.utcDate),
        externalId: apiMatch.matchday,
      },
    }).catch(async () => {
      // If matchday already exists with this externalId, find it
      return await prisma.matchday.findFirst({
        where: { externalId: apiMatch.matchday },
      });
    });

    if (!matchday) {
      throw new Error('Failed to create or find matchday');
    }

    // Upsert match
    const match = await prisma.match.upsert({
      where: { externalId: apiMatch.id },
      update: {
        status: apiMatch.status,
        homeScore: apiMatch.score.fullTime.home ?? undefined,
        awayScore: apiMatch.score.fullTime.away ?? undefined,
        winner: apiMatch.score.winner,
        lastUpdated: new Date(apiMatch.lastUpdated),
      },
      create: {
        externalId: apiMatch.id,
        matchdayId: matchday.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        utcDate: new Date(apiMatch.utcDate),
        venue: homeTeam.venue ?? undefined,
        status: apiMatch.status,
        stage: apiMatch.stage,
        group: apiMatch.group ?? undefined,
        homeScore: apiMatch.score.fullTime.home ?? undefined,
        awayScore: apiMatch.score.fullTime.away ?? undefined,
        winner: apiMatch.score.winner,
        lastUpdated: new Date(apiMatch.lastUpdated),
      },
    });

    await handleMatchThread(match.id, new Date(apiMatch.utcDate), homeTeam.name, awayTeam.name);
  } catch (error) {
    console.error(`Failed to sync match ${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}:`, error);
    // Continue with next match instead of throwing
  }
}

async function handleMatchThread(matchId: string, matchDate: Date, homeName: string, awayName: string) {
  const now = new Date();
  const diffTime = matchDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  try {
    // Check if a thread already exists for this match
    const existingThread = await prisma.thread.findUnique({
      where: { matchId },
    });

    if (diffDays <= 14 && diffDays >= -14) {
      // Within the active window (before or after 2 weeks)
      if (!existingThread) {
        // Create the thread
        await prisma.thread.create({
          data: {
            title: `Match Thread: ${homeName} vs ${awayName}`,
            content: `Discuss the upcoming match between ${homeName} and ${awayName}!`,
            matchId: matchId,
            tags: {
              connectOrCreate: [
                { where: { name: 'Match Thread' }, create: { name: 'Match Thread' } },
                { where: { name: 'Premier League' }, create: { name: 'Premier League' } },
              ],
            },
          },
        });
        console.log(`Created match thread for ${homeName} vs ${awayName}`);
      } else if (existingThread.isLocked) {
        // Unlock if somehow it got locked early
        await prisma.thread.update({
          where: { id: existingThread.id },
          data: { isLocked: false }
        });
      }
    } else if (diffDays < -14 || diffDays > 14) {
      // More than 2 weeks after or before
      if (existingThread && !existingThread.isLocked) {
        // Lock the thread
        await prisma.thread.update({
          where: { id: existingThread.id },
          data: { isLocked: true },
        });
        console.log(`Locked match thread for ${homeName} vs ${awayName}`);
      }
    }
  } catch (err) {
    console.error(`Failed to handle thread for match ${matchId}:`, err);
  }
}

function getFormattedDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}