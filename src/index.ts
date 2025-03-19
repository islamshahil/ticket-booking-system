import { Pool } from 'pg';
import redisClient from './config/redis';
import db from './config/db';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import './config/db';  // PostgreSQL connection
import './config/redis';  // Redis connection
import bookingRoutes from './routes/booking.routes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Function to sync Redis cache with latest booked seats
const syncRedisWithDatabase = async () => {
    try {
        console.log('🔄 Syncing Redis with database...');
        // Flush old Redis cache
        await redisClient.flushAll();
        // Fetch all booked seats from the database
        const query = `SELECT event_id, id AS seat_id, seat_number FROM seats WHERE is_booked = TRUE`;
        const { rows } = await db.query(query);
        for (const row of rows) {
            const seatKey = `event:${row.event_id}:seat:${row.seat_id}`;
            await redisClient.set(seatKey, 'booked');
        }
        console.log(`✅ Redis synced with ${rows.length} booked seats.`);
    } catch (error) {
        console.error('❌ Error syncing Redis with database:', error);
    }
};

syncRedisWithDatabase();

app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
