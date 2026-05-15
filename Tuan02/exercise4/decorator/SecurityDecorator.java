package exercise4.decorator;

public class SecurityDecorator extends PaymentProcessorDecorator {
    public SecurityDecorator(PaymentProcessor processor) { super(processor); }

    @Override
    public boolean process(double amount) {
        System.out.println("  [Security] Xác thực danh tính người dùng...");
        System.out.println("  [Security] Kiểm tra gian lận...");
        if (amount > 10000) {
            System.out.println("  [Security] Giao dich lon - Yeu cau OTP 2 buoc...");
            System.out.println("  [Security] OTP xac nhan: OK");
        }
        System.out.println("  [Security] Xac thuc bao mat: PASS");
        return super.process(amount);
    }
}
