import cron from 'node-cron';
import { fetchAndSyncPremierLeagueTeams } from './team';
import { fetchAndSyncPremierLeagueStandings } from './standings';
import { fetchAndSyncPremierLeagueMatches } from './matches';

/**
 * Initialize and schedule all background jobs
 * - Teams: Synced once a season (August 1st at 00:00 AM)
 * - Matches: Synced twice daily (6:00 AM to get the day's matches, 6:00 PM to get the finished results)
 * - Standings: Synced twice daily (6:15 AM, 6:15 PM, shortly after matches are updated)
 */
export function initializeScheduler(): void {
  console.log('Initializing background job scheduler...');

  // Schedule team sync: Once a season on August 1st at 00:00 AM
  cron.schedule('0 0 1 8 *', async () => {
    console.log('[SCHEDULER] Running annual team sync...');
    try {
      await fetchAndSyncPremierLeagueTeams();
      console.log('[SCHEDULER] Annual team sync completed successfully');
    } catch (error) {
      console.error('[SCHEDULER] Annual team sync failed:', error);
    }
  });

  // Schedule matches sync: Twice daily at 6:00 AM and 6:00 PM (18:00)
  cron.schedule('0 6,18 * * *', async () => {
    console.log('[SCHEDULER] Running twice-daily matches sync...');
    try {
      await fetchAndSyncPremierLeagueMatches();
      console.log('[SCHEDULER] Daily matches sync completed successfully');
    } catch (error) {
      console.error('[SCHEDULER] Daily matches sync failed:', error);
    }
  });

  // Schedule standings sync: Twice daily at 6:15 AM and 6:15 PM (18:15)
  cron.schedule('15 6,18 * * *', async () => {
    console.log('[SCHEDULER] Running twice-daily standings sync...');
    try {
      await fetchAndSyncPremierLeagueStandings();
      console.log('[SCHEDULER] Daily standings sync completed successfully');
    } catch (error) {
      console.error('[SCHEDULER] Daily standings sync failed:', error);
    }
  });

  console.log('Background job scheduler initialized successfully');
  console.log('• Teams sync: Every August 1st at 00:00 AM');
  console.log('• Matches sync: Every day at 06:00 AM and 06:00 PM');
  console.log('• Standings sync: Every day at 06:15 AM and 06:15 PM');
}

/**
 * Run all sync jobs immediately (useful for testing or manual triggers)
 */
export async function runAllSyncsNow(): Promise<void> {
  console.log('Running all syncs immediately...');
  try {
    await fetchAndSyncPremierLeagueTeams();
    await fetchAndSyncPremierLeagueStandings();
    await fetchAndSyncPremierLeagueMatches();
    console.log('All syncs completed successfully');
  } catch (error) {
    console.error('Error running syncs:', error);
    throw error;
  }
}

/**
 * Run only the daily syncs (standings and matches)
 */
export async function runDailySyncsNow(): Promise<void> {
  console.log('Running daily syncs immediately...');
  try {
    await fetchAndSyncPremierLeagueStandings();
    await fetchAndSyncPremierLeagueMatches();
    console.log('Daily syncs completed successfully');
  } catch (error) {
    console.error('Error running daily syncs:', error);
    throw error;
  }
}
