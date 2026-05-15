package exercise3.strategy;

public class ConsumptionTaxStrategy implements TaxStrategy {
    private final double rate;

    public ConsumptionTaxStrategy(double rate) { this.rate = rate; }

    @Override
    public double calculateTax(double price) { return price * rate; }

    @Override
    public String getTaxName() { return String.format("Thuế tiêu thụ đặc biệt (%.0f%%)", rate * 100); }
}
