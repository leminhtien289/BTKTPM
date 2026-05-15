package exercise2.strategy;

public interface ShippingStrategy {
    double calculateShippingCost(double orderAmount);
    String getMethodName();
    int getEstimatedDays();
}
