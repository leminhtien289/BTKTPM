package exercise2.state;

import exercise2.Order;

public class CancelledState implements OrderState {
    @Override
    public void processOrder(Order order) {
        System.out.println("  [State] Không thể xử lý đơn hàng đã hủy!");
    }

    @Override
    public void cancelOrder(Order order) {
        System.out.println("  [State] Đơn hàng đã hủy và hoàn tiền cho khách.");
    }

    @Override
    public String getStateName() { return "Đã hủy"; }
}
