package exercise4.decorator;

import exercise4.strategy.PaymentStrategy;

public class BasePaymentProcessor implements PaymentProcessor {
    private final PaymentStrategy strategy;

    public BasePaymentProcessor(PaymentStrategy strategy) { this.strategy = strategy; }

    @Override
    public boolean process(double amount) {
        return strategy.pay(amount);
    }
}
