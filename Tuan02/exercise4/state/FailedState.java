package exercise4.state;

import exercise4.Payment;

public class FailedState implements PaymentState {
    @Override
    public void processPayment(Payment payment) {
        System.out.println("  [State] Thử lại giao dịch...");
        payment.setState(new ProcessingState());
    }

    @Override
    public void refundPayment(Payment payment) {
        System.out.println("  [State] Giao dịch thất bại - không có tiền để hoàn!");
    }

    @Override
    public String getStateName() { return "Thất bại"; }
}
