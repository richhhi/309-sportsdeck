import 'dotenv/config';
import { prisma } from "../../lib/prisma";
import { FootballDataResponse, Team as ApiTeam } from './interfaces';

const API_KEY = process.env.FOOTBALL_DATA_API_TOKEN;
const BASE_URL = 'https://api.football-data.org/v4';

export async function fetchAndSyncPremierLeagueTeams(): Promise<void> {
  const url = `${BASE_URL}/competitions/PL/teams?season=2025`;

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

    const data: FootballDataResponse = await response.json();
    
    // Sync competition first
    await syncCompetitionToDatabase(data.competition);
    
    // Sync season
    await syncSeasonToDatabase(data.season);
    
    // Sync teams to database
    for (const team of data.teams) {
      await syncTeamToDatabase(team, data.competition.id);
    }
    
    console.log(`Successfully synced ${data.teams.length} Premier League teams`);
  } catch (error) {
    console.error('Failed to fetch and sync teams:', error);
    throw error;
  }
}

async function syncCompetitionToDatabase(apiCompetition: any): Promise<void> {
  try {
    await prisma.competition.upsert({
      where: { externalId: apiCompetition.id },
      update: {
        name: apiCompetition.name,
        code: apiCompetition.code,
        type: apiCompetition.type,
        emblem: apiCompetition.emblem,
      },
      create: {
        externalId: apiCompetition.id,
        name: apiCompetition.name,
        code: apiCompetition.code,
        type: apiCompetition.type,
        emblem: apiCompetition.emblem,
      },
    });
  } catch (error) {
    console.error(`Failed to sync competition ${apiCompetition.name}:`, error);
    throw error;
  }
}

async function syncSeasonToDatabase(apiSeason: any): Promise<void> {
  try {
    await prisma.season.upsert({
      where: { externalId: apiSeason.id },
      update: {
        startDate: new Date(apiSeason.startDate),
        endDate: new Date(apiSeason.endDate),
        currentMatchday: apiSeason.currentMatchday,
        winner: apiSeason.winner,
      },
      create: {
        externalId: apiSeason.id,
        startDate: new Date(apiSeason.startDate),
        endDate: new Date(apiSeason.endDate),
        currentMatchday: apiSeason.currentMatchday,
        winner: apiSeason.winner,
      },
    });
  } catch (error) {
    console.error(`Failed to sync season ${apiSeason.id}:`, error);
    throw error;
  }
}

async function syncTeamToDatabase(apiTeam: ApiTeam, competitionId: number): Promise<void> {
  try {
    // Ensure area exists
    const area = await prisma.area.upsert({
      where: { id: apiTeam.area.id },
      update: {
        name: apiTeam.area.name,
        code: apiTeam.area.code,
        flag: apiTeam.area.flag,
      },
      create: {
        id: apiTeam.area.id,
        name: apiTeam.area.name,
        code: apiTeam.area.code,
        flag: apiTeam.area.flag,
      },
    });

    // Upsert team
    const team = await prisma.team.upsert({
      where: { externalId: apiTeam.id },
      update: {
        name: apiTeam.name,
        shortName: apiTeam.shortName,
        tla: apiTeam.tla,
        crest: apiTeam.crest,
        address: apiTeam.address,
        website: apiTeam.website,
        founded: apiTeam.founded,
        clubColors: apiTeam.clubColors,
        venue: apiTeam.venue,
        lastUpdated: new Date(apiTeam.lastUpdated),
      },
      create: {
        externalId: apiTeam.id,
        areaId: apiTeam.area.id,
        name: apiTeam.name,
        shortName: apiTeam.shortName,
        tla: apiTeam.tla,
        crest: apiTeam.crest,
        address: apiTeam.address,
        website: apiTeam.website,
        founded: apiTeam.founded,
        clubColors: apiTeam.clubColors,
        venue: apiTeam.venue,
        lastUpdated: new Date(apiTeam.lastUpdated),
      },
    });

    // Link team to running competitions
    for (const runningComp of apiTeam.runningCompetitions) {
      const competition = await prisma.competition.findFirst({
        where: { externalId: runningComp.id },
      });
      
      if (competition) {
        // Use connect to establish the many-to-many relationship
        await prisma.team.update({
          where: { id: team.id },
          data: {
            competitions: {
              connect: { id: competition.id },
            },
          },
        });
      }
    }

    // Sync coach if exists
    if (apiTeam.coach) {
      await prisma.coach.upsert({
        where: { externalId: apiTeam.coach.id },
        update: {
          firstName: apiTeam.coach.firstName,
          lastName: apiTeam.coach.lastName,
          name: apiTeam.coach.name,
          dateOfBirth: apiTeam.coach.dateOfBirth,
          nationality: apiTeam.coach.nationality,
          contractStart: apiTeam.coach.contract.start,
          contractEnd: apiTeam.coach.contract.until,
        },
        create: {
          externalId: apiTeam.coach.id,
          teamId: team.id,
          firstName: apiTeam.coach.firstName,
          lastName: apiTeam.coach.lastName,
          name: apiTeam.coach.name,
          dateOfBirth: apiTeam.coach.dateOfBirth,
          nationality: apiTeam.coach.nationality,
          contractStart: apiTeam.coach.contract.start,
          contractEnd: apiTeam.coach.contract.until,
        },
      });
    }

    // Sync staff members
    for (const staffMember of apiTeam.staff) {
      await prisma.staff.upsert({
        where: { externalId: staffMember.id },
        update: {
          firstName: staffMember.firstName,
          lastName: staffMember.lastName,
          name: staffMember.name,
          dateOfBirth: staffMember.dateOfBirth,
          nationality: staffMember.nationality,
          contractStart: staffMember.contract.start,
          contractEnd: staffMember.contract.until,
        },
        create: {
          externalId: staffMember.id,
          teamId: team.id,
          firstName: staffMember.firstName,
          lastName: staffMember.lastName,
          name: staffMember.name,
          dateOfBirth: staffMember.dateOfBirth,
          nationality: staffMember.nationality,
          contractStart: staffMember.contract.start,
          contractEnd: staffMember.contract.until,
        },
      });
    }

    // Sync squad players
    for (const player of apiTeam.squad) {
      await prisma.player.upsert({
        where: { externalId: player.id },
        update: {
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth ?? undefined,
          nationality: player.nationality,
        },
        create: {
          externalId: player.id,
          teamId: team.id,
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth ?? undefined,
          nationality: player.nationality,
        },
      });
    }
  } catch (error) {
    console.error(`Failed to sync team ${apiTeam.name}:`, error);
    // Continue with next team instead of throwing
  }
}