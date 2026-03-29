import 'dotenv/config';
import { initializeScheduler } from './scheduler';

console.log('Starting standalone cron scheduler...');
initializeScheduler();
