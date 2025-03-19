import { Router, Request, Response } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();

// Explicitly wrapping async controllers in try-catch
router.post('/book', async (req: Request, res: Response) => {
    await BookingController.bookTicket(req, res);
});

router.delete('/cancel/:bookingId', async (req: Request, res: Response) => {
    await BookingController.cancelBooking(req, res);
});

router.get('/user/:userId', async (req: Request, res: Response) => {
    await BookingController.getUserBookings(req, res);
});

export default router;
