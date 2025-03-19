import { Pool } from 'pg';
import redisClient from '../config/redis';
import db from '../config/db';

export class BookingService {
    
    // Check seat availability
    static async checkSeatAvailability(eventId: number, seatNumber: string): Promise<boolean> {
        const seatKey = `event:${eventId}:seat:${seatNumber}`;
        // console.log(seatKey);
        // Check if the seat is already booked in Redis
        const isBooked = await redisClient.get(seatKey);
        if (isBooked) return false;

        // Query the database to get seat_id
        const query = `SELECT id FROM seats WHERE event_id = $1 AND seat_number = $2 AND is_booked = FALSE`;
        const { rows } = await db.query(query, [eventId, seatNumber]);
        return rows.length > 0 ? rows[0].id : false; // Return seat_id if available, else false
    }

    // Book a seat
    static async bookTicket(userId: number, eventId: number, seatNumber: string) {
        
        // First, check if the seat is available
        const seatId = await this.checkSeatAvailability(eventId, seatNumber);
        // console.log(seatId);
        if (!seatId) {
            throw new Error('Seat already booked');
        }

        // Cache the seat booking in Redis (set a lock)
        const seatKey = `event:${eventId}:seat:${seatNumber}`;
        await redisClient.set(seatKey, 'booked');

        try {
            await db.query('BEGIN'); // Start transaction
            // Lock seat in database
            const updateSeatQuery = `
                UPDATE seats
                SET is_booked = TRUE, booked_by = $1
                WHERE id = $2 AND event_id = $3 AND is_booked = FALSE
                RETURNING id;
            `;
            const { rows } = await db.query(updateSeatQuery, [userId, seatId, eventId]);
            if (rows.length === 0) {
                throw new Error('Seat booking failed');
            }
            // Create booking entry
            const insertBookingQuery = `
                INSERT INTO bookings (user_id, event_id, seat_id, status)
                VALUES ($1, $2, $3, 'CONFIRMED')
                RETURNING id;
            `;
            const booking = await db.query(insertBookingQuery, [userId, eventId, seatId]);
            // Commit transaction
            await db.query('COMMIT');
            return { bookingId: booking.rows[0].id, status: 'CONFIRMED' };

        } catch (error: unknown) {
            await db.query('ROLLBACK');
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
            
        }
    }

    // Cancel booking
    static async cancelBooking(bookingId: number) {
        // Fetch booking details
        const query = `SELECT event_id, seat_id FROM bookings WHERE id = $1`;
        const { rows } = await db.query(query, [bookingId]);
        if (rows.length === 0) {
            throw new Error('Booking not found');
        }
        const { event_id, seat_id } = rows[0];

        // Update booking from PostgreSQL
        await db.query(`UPDATE bookings SET status = 'CANCELED' WHERE id = $1`, [bookingId]);

        // Query the database to get seatNumber 
        const seatQuery = `SELECT seat_number FROM seats WHERE event_id = $1 AND id = $2 AND is_booked = TRUE`;
        const { rows: seatRows } = await db.query(seatQuery, [event_id, seat_id]);
        if (seatRows.length === 0) {
            throw new Error('Seat not found');
        }
        const { seat_number } = seatRows[0];

        // Remove booking from Redis
        const seatKey = `event:${event_id}:seat:${seat_number}`;
        await redisClient.del(seatKey);

        return { bookingId, status: 'CANCELLED' };
    }

    // Fetch all bookings for a user
    static async getUserBookings(userId: number) {
        const query = `SELECT * FROM bookings WHERE user_id = $1`;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }
}
