package exercise3.decorator;

import exercise3.Product;

public abstract class ProductDecorator implements Product {
    protected final Product product;

    public ProductDecorator(Product product) {
        this.product = product;
    }

    @Override
    public String getName() { return product.getName(); }

    @Override
    public double getBasePrice() { return product.getBasePrice(); }
}
