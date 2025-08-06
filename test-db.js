// Simple test script to check database connectivity and user creation
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

dotenv.config();

// Create database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testDatabase() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        const result = await client`SELECT NOW() as current_time`;
        console.log('✅ Database connection successful:', result[0].current_time);

        // Test user creation
        const testUserId = 'test_user_' + Date.now();
        console.log('Testing user creation with ID:', testUserId);

        try {
            const insertResult = await client`
        INSERT INTO users (id, name, level, total_xp, theme, join_date)
        VALUES (${testUserId}, 'Test User', 1, 0, 'light', NOW())
        RETURNING *
      `;

            console.log('✅ User created successfully:', insertResult[0]);

            // Test habit creation for this user
            const habitResult = await client`
        INSERT INTO habits (user_id, name, category, frequency, icon, created_date, is_active)
        VALUES (${testUserId}, 'Test Habit', 'Health', 'daily', '🎯', NOW(), true)
        RETURNING *
      `;

            console.log('✅ Habit created successfully:', habitResult[0]);

            // Cleanup
            await client`DELETE FROM habits WHERE user_id = ${testUserId}`;
            await client`DELETE FROM users WHERE id = ${testUserId}`;
            console.log('✅ Cleanup completed');

        } catch (insertError) {
            console.error('❌ Error during insert operations:', insertError);
        }

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

testDatabase();
