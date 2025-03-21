import { consumer } from '../config/kafka';
import redisClient from '../config/redis';

const processBookingEvent = async (message: any) => {
    try {
        const event = JSON.parse(message.value.toString());
        if (event.type === 'ticket-booked') {
            console.log(`✅ Processing booking event: ${event.bookingId}`);
            const seatKey = `event:${event.eventId}:seat:${event.seatNumber}`;
            await redisClient.set(seatKey, 'booked');
            console.log(`🔒 Seat marked booked in Redis: ${seatKey}`);
            // Can send emails
        }
        if (event.type === 'ticket-canceled') {
            console.log(`✅ Processing cancellation event: ${event.bookingId}`);
            const seatKey = `event:${event.eventId}:seat:${event.seatNumber}`;
            await redisClient.del(seatKey);
            console.log(`🔓 Seat marked available in Redis: ${seatKey}`);
            // Can send emails
        }
    } catch (error) {
        console.error('❌ Error processing Kafka event:', error);
    }
};

const startTicketEventsConsumer = async () => {
    await consumer.subscribe({ topic: 'ticket-events', fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (message.value) {
                await processBookingEvent(message);
            }
        },
    });
    console.log('📡 Ticket Events Consumer running...');
};

startTicketEventsConsumer();
