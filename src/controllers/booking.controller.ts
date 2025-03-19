import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';

export class BookingController {

    // Book a ticket
    static async bookTicket(req: Request, res: Response) {
        try {
            const { userId, eventId, seatNumber } = req.body;
            const booking = await BookingService.bookTicket(userId, eventId, seatNumber);
            return res.status(201).json(booking);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            } else {
                return res.status(400).json({ error: 'An unknown error occurred' });
            }
        }
    }

    // Cancel a booking
    static async cancelBooking(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.bookingId);
            const result = await BookingService.cancelBooking(bookingId);
            return res.status(200).json(result);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            } else {
                return res.status(400).json({ error: 'An unknown error occurred' });
            }
        }
    }

    // Fetch user bookings
    static async getUserBookings(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId);
            const bookings = await BookingService.getUserBookings(userId);
            return res.status(200).json(bookings);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            } else {
                return res.status(400).json({ error: 'An unknown error occurred' });
            }
        }
    }
}
