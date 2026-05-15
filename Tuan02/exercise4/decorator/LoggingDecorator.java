package exercise4.decorator;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class LoggingDecorator extends PaymentProcessorDecorator {
    public LoggingDecorator(PaymentProcessor processor) { super(processor); }

    @Override
    public boolean process(double amount) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        System.out.printf("  [Log %s] Bắt đầu giao dịch $%.2f%n", time, amount);
        boolean result = super.process(amount);
        System.out.println("  [Log] Kết quả: " + (result ? "THANH CONG" : "THAT BAI"));
        return result;
    }
}
