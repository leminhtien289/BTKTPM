package exercise2.strategy;

public class SameDayShipping implements ShippingStrategy {
    @Override
    public double calculateShippingCost(double orderAmount) {
        return orderAmount * 0.15 + 20;
    }

    @Override
    public String getMethodName() { return "Giao trong ngày"; }

    @Override
    public int getEstimatedDays() { return 0; }
}
