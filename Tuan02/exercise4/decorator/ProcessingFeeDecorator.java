package exercise4.decorator;

public class ProcessingFeeDecorator extends PaymentProcessorDecorator {
    private final double feeRate;

    public ProcessingFeeDecorator(PaymentProcessor processor, double feeRate) {
        super(processor);
        this.feeRate = feeRate;
    }

    @Override
    public boolean process(double amount) {
        double fee = amount * feeRate;
        double total = amount + fee;
        System.out.printf("  [ProcessingFee] Phi xu ly %.0f%%: +$%.2f | $%.2f -> $%.2f%n",
                feeRate * 100, fee, amount, total);
        return super.process(total);
    }
}
