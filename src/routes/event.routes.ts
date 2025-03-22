import { Router } from 'express';
import db from '../config/db';

const router = Router();

router.get('/api/events', async (req, res) => {
  try {
    const eventsRes = await db.query('SELECT * FROM events');
    const events = eventsRes.rows;

    for (const event of events) {
      const seatRes = await db.query('SELECT seat_number, is_booked FROM seats WHERE event_id = $1', [event.id]);
      event.seats = seatRes.rows;
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
