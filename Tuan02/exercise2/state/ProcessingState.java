package exercise2.state;

import exercise2.Order;

public class ProcessingState implements OrderState {
    @Override
    public void processOrder(Order order) {
        System.out.println("  [State] Đóng gói và vận chuyển đơn hàng...");
        System.out.println("  [State] Đơn hàng đã được giao -> chuyển sang Đã giao.");
        order.setState(new DeliveredState());
    }

    @Override
    public void cancelOrder(Order order) {
        System.out.println("  [State] Không thể hủy đơn hàng đang xử lý!");
    }

    @Override
    public String getStateName() { return "Đang xử lý"; }
}
