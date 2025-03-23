import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer } from 'http';

import './config/db';
import './config/redis';
import bookingRoutes from './routes/booking.routes';
import { initSocketIO } from './config/socket';
import uiRoutes from './routes/ui.routes';
import eventRoutes from './routes/event.routes';
// import './workers/ticketEvents.consumer';

dotenv.config();

const app = express();
const server = createServer(app);
const io = initSocketIO(server);

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
  })
);
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', uiRoutes);
app.use(eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start the server
const PORT = parseInt(process.env.PORT || '5000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
