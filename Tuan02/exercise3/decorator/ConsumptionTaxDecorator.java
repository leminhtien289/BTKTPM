package exercise3.decorator;

import exercise3.Product;

public class ConsumptionTaxDecorator extends ProductDecorator {
    private final double taxRate;

    public ConsumptionTaxDecorator(Product product, double taxRate) {
        super(product);
        this.taxRate = taxRate;
    }

    @Override
    public double getFinalPrice() {
        return product.getFinalPrice() * (1 + taxRate);
    }

    @Override
    public String getDescription() {
        return String.format("%s + ThuếTT(%.0f%%)[$%.2f]",
                product.getDescription(), taxRate * 100, product.getFinalPrice() * taxRate);
    }
}
