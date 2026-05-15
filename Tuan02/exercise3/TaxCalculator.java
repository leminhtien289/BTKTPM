package exercise3;

import exercise3.strategy.TaxStrategy;

public class TaxCalculator {
    private TaxStrategy strategy;

    public TaxCalculator(TaxStrategy strategy) { this.strategy = strategy; }

    public void setStrategy(TaxStrategy strategy) { this.strategy = strategy; }

    public double calculateTotal(double basePrice) {
        double tax = strategy.calculateTax(basePrice);
        double total = basePrice + tax;
        System.out.printf("  [Strategy] %-35s | Thuế: $%6.2f | Tổng: $%8.2f%n",
                strategy.getTaxName(), tax, total);
        return total;
    }
}
