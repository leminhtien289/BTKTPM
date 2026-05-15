package exercise2.state;

import exercise2.Order;

public interface OrderState {
    void processOrder(Order order);
    void cancelOrder(Order order);
    String getStateName();
}
