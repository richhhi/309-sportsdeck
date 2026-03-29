import 'dotenv/config';
import { fetchAndSyncPremierLeagueTeams } from "../../app/jobs/team";
import { fetchAndSyncPremierLeagueMatches } from "../../app/jobs/matches";
import { fetchAndSyncPremierLeagueStandings } from "../../app/jobs/standings";

async function runTests() {
  try {
    console.log('=== Starting API Sync Tests ===\n');

    // Step 1: Sync Teams (must run first)
    console.log('Step 1: Syncing Teams...');
    await fetchAndSyncPremierLeagueTeams();
    console.log('✓ Teams synced successfully\n');

    // Step 2: Sync Matches (depends on teams)
    console.log('Step 2: Syncing Matches...');
    await fetchAndSyncPremierLeagueMatches();
    console.log('✓ Matches synced successfully\n');

    // Step 3: Sync Standings (depends on teams)
    console.log('Step 3: Syncing Standings...');
    await fetchAndSyncPremierLeagueStandings();
    console.log('✓ Standings synced successfully\n');

    console.log('=== All syncs completed successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  }
}

runTests();