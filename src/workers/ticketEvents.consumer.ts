import { consumer } from '../config/kafka';
import { getIO } from '../config/socket';

const processBookingEvent = async (message: any) => {
    const io = getIO();
    try {
        const event = JSON.parse(message.value.toString());
        if (event.type === 'ticket-booked') {
            console.log(`✅ Processing booking event: ${event.bookingId}`);

            const payload = {
                eventId: event.eventId,
                seatNumber: event.seatNumber,
                status: 'booked',
                timestamp: event.timestamp
            };

            io.emit('seat-update', payload); // 🔥 Broadcast to all
            console.log(`📡 Emitted seat-booked: ${JSON.stringify(payload)}`);

        }
        if (event.type === 'ticket-canceled') {
            console.log(`✅ Processing cancellation event: ${event.bookingId}`);

            const payload = {
                eventId: event.eventId,
                seatNumber: event.seatNumber,
                status: 'available',
                timestamp: event.timestamp
            };

            io.emit('seat-update', payload); // 🔥 Broadcast to all
            console.log(`📡 Emitted seat-canceled: ${JSON.stringify(payload)}`);
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
