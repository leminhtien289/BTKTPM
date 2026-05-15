package exercise3.strategy;

public class VATStrategy implements TaxStrategy {
    private final double rate;

    public VATStrategy(double rate) { this.rate = rate; }

    @Override
    public double calculateTax(double price) { return price * rate; }

    @Override
    public String getTaxName() { return String.format("Thuế GTGT (%.0f%%)", rate * 100); }
}
