package exercise2.strategy;

public class ExpressShipping implements ShippingStrategy {
    @Override
    public double calculateShippingCost(double orderAmount) {
        return orderAmount * 0.10 + 10;
    }

    @Override
    public String getMethodName() { return "Vận chuyển nhanh"; }

    @Override
    public int getEstimatedDays() { return 2; }
}
