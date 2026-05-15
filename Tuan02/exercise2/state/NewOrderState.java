package exercise2.state;

import exercise2.Order;

public class NewOrderState implements OrderState {
    @Override
    public void processOrder(Order order) {
        System.out.println("  [State] Kiểm tra thông tin đơn hàng...");
        System.out.println("  [State] Đơn hàng hợp lệ -> chuyển sang Đang xử lý.");
        order.setState(new ProcessingState());
    }

    @Override
    public void cancelOrder(Order order) {
        System.out.println("  [State] Hủy đơn hàng mới tạo.");
        order.setState(new CancelledState());
    }

    @Override
    public String getStateName() { return "Mới tạo"; }
}
