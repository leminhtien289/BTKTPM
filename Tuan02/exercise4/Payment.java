package exercise4;

import exercise4.state.PaymentState;
import exercise4.state.PendingState;
import exercise4.decorator.PaymentProcessor;

public class Payment {
    private final String id;
    private final double amount;
    private final String description;
    private PaymentState state;
    private PaymentProcessor processor;

    public Payment(String id, double amount, String description) {
        this.id = id;
        this.amount = amount;
        this.description = description;
        this.state = new PendingState();
    }

    public void setProcessor(PaymentProcessor processor) { this.processor = processor; }
    public void setState(PaymentState state) { this.state = state; }

    public void processPayment() {
        System.out.println("\n[Payment " + id + " | " + description + " | $" + amount + "]");
        System.out.println("  Trang thai: " + state.getStateName());
        state.processPayment(this);
        System.out.println("  -> Trang thai moi: " + state.getStateName());
    }

    public void refund() {
        System.out.println("\n[Hoan tien " + id + "]");
        System.out.println("  Trang thai: " + state.getStateName());
        state.refundPayment(this);
        System.out.println("  -> Trang thai moi: " + state.getStateName());
    }

    // Được gọi bởi ProcessingState để thực thi thanh toán qua processor
    public boolean executePayment() {
        if (processor != null) {
            return processor.process(amount);
        }
        System.out.println("  [Payment] Khong co processor!");
        return false;
    }
}
