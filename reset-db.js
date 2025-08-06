import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
    try {
        console.log('Dropping all tables...');

        // Drop tables in correct order (child tables first)
        await db.execute(sql`DROP TABLE IF EXISTS achievements CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS completions CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS streaks CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS habits CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

        console.log('All tables dropped successfully');

        // Exit the process
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
