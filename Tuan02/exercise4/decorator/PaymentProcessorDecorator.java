package exercise4.decorator;

public abstract class PaymentProcessorDecorator implements PaymentProcessor {
    protected final PaymentProcessor processor;

    public PaymentProcessorDecorator(PaymentProcessor processor) { this.processor = processor; }

    @Override
    public boolean process(double amount) {
        return processor.process(amount);
    }
}
