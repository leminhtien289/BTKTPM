package exercise3.strategy;

public interface TaxStrategy {
    double calculateTax(double price);
    String getTaxName();
}
