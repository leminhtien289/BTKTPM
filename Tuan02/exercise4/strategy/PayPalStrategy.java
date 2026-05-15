package exercise4.strategy;

public class PayPalStrategy implements PaymentStrategy {
    private final String email;

    public PayPalStrategy(String email) { this.email = email; }

    @Override
    public boolean pay(double amount) {
        System.out.printf("  [PayPal] Thanh toán $%.2f | Tài khoản: %s%n", amount, email);
        return true;
    }

    @Override
    public String getMethodName() { return "PayPal"; }
}
