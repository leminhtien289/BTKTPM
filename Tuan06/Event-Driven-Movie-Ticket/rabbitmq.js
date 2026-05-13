const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://localhost';

// Helper publish event lên RabbitMQ exchange
async function publishEvent(exchangeName, routingKey, message) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        
        // Tạo exchange (loại topic để routing linh hoạt)
        await channel.assertExchange(exchangeName, 'topic', { durable: true });
        
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`[Event Published] ${exchangeName} -> ${routingKey}:`, message);

        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
        console.error('[RabbitMQ Publish Error]', error);
    }
}

// Helper consume event từ RabbitMQ
async function consumeEvent(exchangeName, routingKey, queueName, callback) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchangeName, 'topic', { durable: true });
        const q = await channel.assertQueue(queueName, { durable: true });
        
        // Bind queue vào exchange với routing key tương ứng
        await channel.bindQueue(q.queue, exchangeName, routingKey);

        console.log(`[*] Waiting for events in ${q.queue} (${routingKey}). To exit press CTRL+C`);

        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content, msg);
                channel.ack(msg); // Xác nhận đã xử lý
            }
        });
    } catch (error) {
        console.error('[RabbitMQ Consume Error]', error);
        // Tự động retry connect sau 5 giây nếu RabbitMQ chưa lên
        setTimeout(() => consumeEvent(exchangeName, routingKey, queueName, callback), 5000);
    }
}

module.exports = { publishEvent, consumeEvent };
