const amqp = require("amqplib");

const RABBITMQ_URL = "amqp://tien:12345678@rabbitmq:5672";
const QUEUE = "order_queue";
const DEAD_LETTER_QUEUE = "order_queue.dlq";

let channel;

const connectWithRetry = async () => {
    try {
        console.log("Consumer is connecting...");
        const conn = await amqp.connect(RABBITMQ_URL);
        channel = await conn.createChannel();

        // Chỉ nhận 1 message tại 1 thời điểm
        // Tránh consumer bị overwhelmed khi có nhiều message pending
        channel.prefetch(1);

        // Assert DLQ trước (giống producer — đảm bảo cả 2 đều biết queue này)
        await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });

        await channel.assertQueue(QUEUE, {
            durable: true,
            deadLetterExchange: "",
            deadLetterRoutingKey: DEAD_LETTER_QUEUE,
        });

        console.log("Waiting for messages...");

        channel.consume(
            QUEUE,
            async (msg) => {
                if (!msg) return;

                const body = msg.content.toString();
                console.log("Processing:", body);

                try {
                    const data = JSON.parse(body);

                    // Lỗi nghiệp vụ: thiếu orderId — không thể retry, gửi DLQ luôn
                    if (!data.orderId) {
                        throw new BusinessError("Missing orderId");
                    }

                    // Giả lập xử lý (3 giây)
                    await new Promise((resolve) => setTimeout(resolve, 3000));

                    console.log("Process success:", data.orderId);
                    channel.ack(msg);

                } catch (err) {
                    if (err instanceof BusinessError) {
                        // Lỗi nghiệp vụ → nack vào DLQ, không requeue
                        console.log("Business error → DLQ:", err.message);
                        channel.nack(msg, false, false);
                    } else {
                        // Lỗi tạm thời (network, DB timeout...) → requeue để retry
                        console.log("Transient error → requeue:", err.message);
                        channel.nack(msg, false, true);
                    }
                }
            },
            { noAck: false }
        );

    } catch (error) {
        console.log("Consumer failed, retry in 3s...", error.message);
        setTimeout(connectWithRetry, 3000);
    }
};

// Custom error class để phân biệt lỗi nghiệp vụ vs lỗi hệ thống
class BusinessError extends Error {
    constructor(message) {
        super(message);
        this.name = "BusinessError";
    }
}

connectWithRetry();
