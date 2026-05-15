package exercise3.decorator;

import exercise3.Product;

public class VATDecorator extends ProductDecorator {
    private final double vatRate;

    public VATDecorator(Product product, double vatRate) {
        super(product);
        this.vatRate = vatRate;
    }

    @Override
    public double getFinalPrice() {
        return product.getFinalPrice() * (1 + vatRate);
    }

    @Override
    public String getDescription() {
        return String.format("%s + VAT(%.0f%%)[$%.2f]",
                product.getDescription(), vatRate * 100, product.getFinalPrice() * vatRate);
    }
}
