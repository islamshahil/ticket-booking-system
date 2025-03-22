// --- Mock Redis ---
jest.mock('redis', () => {
    return {
      createClient: () => ({
        connect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
      }),
    };
  });
  
  // --- Mock Kafka ---
  jest.mock('kafkajs', () => {
    return {
      Kafka: jest.fn().mockImplementation(() => ({
        producer: () => ({
          connect: jest.fn().mockResolvedValue(undefined),
          send: jest.fn().mockResolvedValue(undefined),
        }),
        consumer: () => ({
          connect: jest.fn().mockResolvedValue(undefined),
          subscribe: jest.fn().mockResolvedValue(undefined),
          run: jest.fn().mockResolvedValue(undefined),
        }),
      })),
    };
  });
  
  // --- Mock DB ---
  jest.mock('../config/db', () => ({
    __esModule: true,
    default: {
      query: jest.fn()
    }
  }));
  
  // --- Imports ---
  import { BookingService } from '../services/booking.service';
  import db from '../config/db';
  import redisClient from '../config/redis';
  import { producer } from '../config/kafka';
  
  // --- Tests ---
  describe('BookingService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('checkSeatAvailability()', () => {
      it('should return seat ID if seat is available', async () => {
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 101 }] });
  
        const result = await BookingService.checkSeatAvailability(1, 'A12');
        expect(result).toBe(101);
      });
  
      it('should return false if seat is booked in Redis', async () => {
        (redisClient.get as jest.Mock).mockResolvedValue('booked');
  
        const result = await BookingService.checkSeatAvailability(1, 'A12');
        expect(result).toBe(false);
      });
    });
  
    describe('bookTicket()', () => {
      it('should successfully book a ticket', async () => {
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (redisClient.set as jest.Mock).mockResolvedValue(undefined);
  
        (db.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ id: 101 }] })  // Seat ID
          .mockResolvedValueOnce({ rows: [{ id: 101 }] })  // Seat update
          .mockResolvedValueOnce({ rows: [{ id: 101 }] }); // Booking insert
  
        const result = await BookingService.bookTicket(1, 1, 'A12');
        expect(result).toEqual({ bookingId: 101, status: 'CONFIRMED' });
        expect(producer.send).toHaveBeenCalled();
      });
    });
  
    describe('cancelBooking()', () => {
      it('should cancel a booking and emit event', async () => {
        (db.query as jest.Mock)
          .mockResolvedValueOnce({ rows: [{ event_id: 1, seat_id: 101 }] }) // booking fetch
          .mockResolvedValueOnce({}) // update booking
          .mockResolvedValueOnce({ rows: [{ seat_number: 'A12' }] }) // seat fetch
          .mockResolvedValueOnce({}); // seat update
  
        const result = await BookingService.cancelBooking(101);
        expect(redisClient.del).toHaveBeenCalled();
        expect(producer.send).toHaveBeenCalled();
        expect(result).toEqual({ bookingId: 101, status: 'CANCELLED' });
      });
    });
  });
  