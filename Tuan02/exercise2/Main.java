package exercise2;

import exercise2.strategy.*;
import exercise2.decorator.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔════════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 2: Order Management System              ║");
        System.out.println("║  Patterns: State + Strategy + Decorator           ║");
        System.out.println("╚════════════════════════════════════════════════════╝");

        // Decorator - xây dựng chuỗi thông báo: BasicNotifier -> Email -> SMS -> Push
        Notifier notifier = new BasicNotifier();
        notifier = new EmailNotifier(notifier, "khach@gmail.com");
        notifier = new SMSNotifier(notifier, "0901234567");
        notifier = new PushNotifier(notifier, "DEVICE-ABC");

        // Đơn hàng 1: Luồng hoàn chỉnh New -> Processing -> Delivered
        System.out.println("\n=== Đơn hàng 1: Luồng đầy đủ ===");
        Order order1 = new Order("ORD-001", "Nguyễn Văn A", 200.0);
        order1.setShippingStrategy(new ExpressShipping());  // Strategy
        order1.setNotifier(notifier);                        // Decorator
        order1.calculateShipping();
        order1.process(); // New -> Processing
        order1.process(); // Processing -> Delivered
        order1.process(); // Delivered - finalized

        // Đơn hàng 2: Hủy từ trạng thái Mới
        System.out.println("\n=== Đơn hàng 2: Hủy từ trạng thái Mới ===");
        Order order2 = new Order("ORD-002", "Trần Thị B", 50.0);
        order2.setShippingStrategy(new StandardShipping());
        order2.setNotifier(notifier);
        order2.calculateShipping();
        order2.cancel();

        // Đơn hàng 3: Thử hủy sau khi đã chuyển sang Processing
        System.out.println("\n=== Đơn hàng 3: Thử hủy khi đang xử lý ===");
        Order order3 = new Order("ORD-003", "Lê Văn C", 300.0);
        order3.setShippingStrategy(new SameDayShipping());
        order3.calculateShipping();
        order3.process(); // New -> Processing
        order3.cancel();  // Sẽ báo lỗi - không thể hủy
    }
}
