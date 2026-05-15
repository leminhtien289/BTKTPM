package exercise4;

import exercise4.strategy.*;
import exercise4.decorator.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 4: Payment System                         ║");
        System.out.println("║  Patterns: State + Strategy + Decorator             ║");
        System.out.println("╚══════════════════════════════════════════════════════╝");

        // Payment 1: The tin dung + Security + Logging -> Refund
        System.out.println("\n=== Thanh toan 1: The tin dung (Security + Log) + Hoan tien ===");
        Payment p1 = new Payment("PAY-001", 500.0, "Mua iPhone 15");
        PaymentProcessor proc1 = new BasePaymentProcessor(
                new CreditCardStrategy("1234567890123456", "NGUYEN VAN A"));
        proc1 = new SecurityDecorator(proc1);
        proc1 = new LoggingDecorator(proc1);
        p1.setProcessor(proc1);

        p1.processPayment(); // Pending -> Processing (khoi tao)
        p1.processPayment(); // Processing -> Completed (thuc hien qua processor)
        p1.refund();         // Completed -> Refunded

        // Payment 2: PayPal + Discount 20% + Phi xu ly 2% + Logging
        System.out.println("\n=== Thanh toan 2: PayPal (Giam gia 20% + Phi xu ly 2% + Log) ===");
        Payment p2 = new Payment("PAY-002", 300.0, "Mua MacBook");
        PaymentProcessor proc2 = new BasePaymentProcessor(
                new PayPalStrategy("customer@gmail.com"));
        proc2 = new DiscountDecorator(proc2, 0.20, "SALE20");
        proc2 = new ProcessingFeeDecorator(proc2, 0.02);
        proc2 = new LoggingDecorator(proc2);
        p2.setProcessor(proc2);

        p2.processPayment(); // Pending -> Processing
        p2.processPayment(); // Processing -> Completed

        // Payment 3: Chuyen khoan lon - kich hoat OTP 2 buoc
        System.out.println("\n=== Thanh toan 3: Chuyen khoan lon (>$10,000 - OTP) ===");
        Payment p3 = new Payment("PAY-003", 15000.0, "Mua xe may");
        PaymentProcessor proc3 = new BasePaymentProcessor(
                new BankTransferStrategy("123456789012", "Vietcombank"));
        proc3 = new SecurityDecorator(proc3); // Security kiem tra OTP cho giao dich lon
        proc3 = new LoggingDecorator(proc3);
        p3.setProcessor(proc3);

        p3.processPayment(); // Pending -> Processing
        p3.processPayment(); // Processing -> Completed (kich hoat OTP check)
    }
}
