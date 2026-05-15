package exercise4.state;

import exercise4.Payment;

public interface PaymentState {
    void processPayment(Payment payment);
    void refundPayment(Payment payment);
    String getStateName();
}
