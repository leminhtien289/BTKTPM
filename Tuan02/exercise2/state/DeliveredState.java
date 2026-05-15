package exercise2.state;

import exercise2.Order;

public class DeliveredState implements OrderState {
    @Override
    public void processOrder(Order order) {
        System.out.println("  [State] Cập nhật trạng thái là Đã giao. Đơn hàng hoàn thành!");
    }

    @Override
    public void cancelOrder(Order order) {
        System.out.println("  [State] Không thể hủy đơn hàng đã giao!");
    }

    @Override
    public String getStateName() { return "Đã giao"; }
}
