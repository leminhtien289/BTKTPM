package exercise4.decorator;

public class DiscountDecorator extends PaymentProcessorDecorator {
    private final double discountRate;
    private final String discountCode;

    public DiscountDecorator(PaymentProcessor processor, double discountRate, String discountCode) {
        super(processor);
        this.discountRate = discountRate;
        this.discountCode = discountCode;
    }

    @Override
    public boolean process(double amount) {
        double discounted = amount * (1 - discountRate);
        System.out.printf("  [Discount] Ma '%s': Giam %.0f%% | $%.2f -> $%.2f%n",
                discountCode, discountRate * 100, amount, discounted);
        return super.process(discounted);
    }
}
