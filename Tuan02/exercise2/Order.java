package exercise2;

import exercise2.state.OrderState;
import exercise2.state.NewOrderState;
import exercise2.strategy.ShippingStrategy;
import exercise2.decorator.Notifier;

public class Order {
    private final String id;
    private final String customerName;
    private final double amount;
    private OrderState state;
    private ShippingStrategy shippingStrategy;
    private Notifier notifier;

    public Order(String id, String customerName, double amount) {
        this.id = id;
        this.customerName = customerName;
        this.amount = amount;
        this.state = new NewOrderState();
    }

    public void setState(OrderState state) { this.state = state; }
    public void setShippingStrategy(ShippingStrategy strategy) { this.shippingStrategy = strategy; }
    public void setNotifier(Notifier notifier) { this.notifier = notifier; }

    public void process() {
        System.out.println("\n[Order " + id + " | " + customerName + "] Trạng thái: " + state.getStateName());
        state.processOrder(this);
        System.out.println("[Order " + id + "] -> Mới: " + state.getStateName());
        sendNotification("Đơn hàng " + id + " -> " + state.getStateName());
    }

    public void cancel() {
        System.out.println("\n[Order " + id + "] Yêu cầu hủy | Trạng thái: " + state.getStateName());
        state.cancelOrder(this);
        System.out.println("[Order " + id + "] -> Mới: " + state.getStateName());
        sendNotification("Đơn hàng " + id + " bị hủy -> " + state.getStateName());
    }

    public void calculateShipping() {
        if (shippingStrategy != null) {
            double cost = shippingStrategy.calculateShippingCost(amount);
            System.out.printf("[Shipping] %s | Chi phí: $%.2f | Dự kiến: %d ngày%n",
                    shippingStrategy.getMethodName(), cost, shippingStrategy.getEstimatedDays());
        }
    }

    private void sendNotification(String message) {
        if (notifier != null) notifier.send(message);
    }
}
