package exercise2.strategy;

public class StandardShipping implements ShippingStrategy {
    @Override
    public double calculateShippingCost(double orderAmount) {
        return orderAmount * 0.05;
    }

    @Override
    public String getMethodName() { return "Vận chuyển tiêu chuẩn"; }

    @Override
    public int getEstimatedDays() { return 5; }
}
