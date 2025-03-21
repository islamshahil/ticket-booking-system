import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
    clientId: 'ticket-booking-system',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'booking-group' });

(async () => {
    await producer.connect();
    await consumer.connect();
    console.log('✅ Connected to Kafka');
})();

export default kafka;
