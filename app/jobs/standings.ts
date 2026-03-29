import 'dotenv/config';
import { prisma } from "../../lib/prisma";
import { StandingsResponse, StandingGroup, TableEntry } from './interfaces';

const API_KEY = process.env.FOOTBALL_DATA_API_TOKEN;
const BASE_URL = 'https://api.football-data.org/v4';

export async function fetchAndSyncPremierLeagueStandings(): Promise<void> {
  const url = `${BASE_URL}/competitions/PL/standings`;

  try {
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

    const data: StandingsResponse = await response.json();

    // Sync season to database
    const season = await syncSeasonToDatabase(data.season);

    // Sync standings to database
    for (const standingGroup of data.standings) {
      const standing = await syncStandingGroupToDatabase(season.id, standingGroup);

      for (const tableEntry of standingGroup.table) {
        await syncStandingToDatabase(standing.id, tableEntry);
      }
    }

    console.log(`Successfully synced Premier League standings`);
  } catch (error) {
    console.error('Failed to fetch and sync standings:', error);
    throw error;
  }
}

export async function syncSeasonToDatabase(seasonData: any): Promise<any> {
  try {
    const season = await prisma.season.upsert({
      where: { externalId: seasonData.id },
      update: {
        currentMatchday: seasonData.currentMatchday,
        winner: seasonData.winner,
      },
      create: {
        externalId: seasonData.id,
        startDate: new Date(seasonData.startDate),
        endDate: new Date(seasonData.endDate),
        currentMatchday: seasonData.currentMatchday,
        winner: seasonData.winner,
      },
    });
    return season;
  } catch (error) {
    console.error(`Failed to sync season:`, error);
    throw error;
  }
}

export async function syncStandingGroupToDatabase(
  seasonId: string,
  standingGroup: StandingGroup
): Promise<any> {
  try {
    const standing = await prisma.standing.upsert({
      where: {
        seasonId_stage_type_group: {
          seasonId,
          stage: standingGroup.stage,
          type: standingGroup.type,
          group: standingGroup.group ?? 'NONE',
        },
      },
      update: {
        // No updates needed for static group data
      },
      create: {
        seasonId,
        stage: standingGroup.stage,
        type: standingGroup.type,
        group: standingGroup.group ?? 'NONE',
      },
    });
    return standing;
  } catch (error) {
    console.error(`Failed to sync standing group:`, error);
    throw error;
  }
}

export async function syncStandingToDatabase(
  standingId: string,
  entry: TableEntry
): Promise<void> {
  try {
    // Find team by external ID
    const team = await prisma.team.findUnique({
      where: { externalId: entry.team.id },
    });

    if (!team) {
      console.warn(`Team with external ID ${entry.team.id} (${entry.team.name}) not found`);
      return;
    }

    // Upsert standing
    await prisma.teamStanding.upsert({
      where: {
        teamId_standingId: {
          teamId: team.id,
          standingId,
        },
      },
      update: {
        position: entry.position,
        matchesPlayed: entry.playedGames,
        won: entry.won,
        drawn: entry.draw,
        lost: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points,
        form: entry.form,
      },
      create: {
        teamId: team.id,
        standingId,
        position: entry.position,
        matchesPlayed: entry.playedGames,
        won: entry.won,
        drawn: entry.draw,
        lost: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points,
        form: entry.form,
      },
    });
  } catch (error) {
    console.error(`Failed to sync standing for team ${entry.team.name}:`, error);
    // Continue with next entry instead of throwing
  }
}