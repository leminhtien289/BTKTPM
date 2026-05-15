package exercise4.state;

import exercise4.Payment;

public class CompletedState implements PaymentState {
    @Override
    public void processPayment(Payment payment) {
        System.out.println("  [State] Giao dịch đã hoàn thành - không thể xử lý lại!");
    }

    @Override
    public void refundPayment(Payment payment) {
        System.out.println("  [State] Đang hoàn tiền về tài khoản...");
        payment.setState(new RefundedState());
    }

    @Override
    public String getStateName() { return "Hoàn thành"; }
}
