package exercise4.state;

import exercise4.Payment;

public class ProcessingState implements PaymentState {
    @Override
    public void processPayment(Payment payment) {
        System.out.println("  [State] Đang xử lý thanh toán...");
        boolean success = payment.executePayment();
        if (success) {
            System.out.println("  [State] Giao dịch thành công!");
            payment.setState(new CompletedState());
        } else {
            System.out.println("  [State] Giao dịch thất bại!");
            payment.setState(new FailedState());
        }
    }

    @Override
    public void refundPayment(Payment payment) {
        System.out.println("  [State] Không thể hoàn tiền trong khi đang xử lý!");
    }

    @Override
    public String getStateName() { return "Đang xử lý"; }
}
