package exercise4.state;

import exercise4.Payment;

public class PendingState implements PaymentState {
    @Override
    public void processPayment(Payment payment) {
        System.out.println("  [State] Khởi tạo giao dịch...");
        payment.setState(new ProcessingState());
        System.out.println("  [State] Chuyển sang: Đang xử lý.");
    }

    @Override
    public void refundPayment(Payment payment) {
        System.out.println("  [State] Không thể hoàn tiền - giao dịch chưa thực hiện!");
    }

    @Override
    public String getStateName() { return "Chờ xử lý"; }
}
