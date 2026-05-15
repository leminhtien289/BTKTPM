package exercise4.state;

import exercise4.Payment;

public class RefundedState implements PaymentState {
    @Override
    public void processPayment(Payment payment) {
        System.out.println("  [State] Không thể xử lý giao dịch đã hoàn tiền!");
    }

    @Override
    public void refundPayment(Payment payment) {
        System.out.println("  [State] Tiền đã được hoàn về tài khoản thành công.");
    }

    @Override
    public String getStateName() { return "Đã hoàn tiền"; }
}
