package exercise3;

public class BaseProduct implements Product {
    private final String name;
    private final double price;

    public BaseProduct(String name, double price) {
        this.name = name;
        this.price = price;
    }

    @Override
    public String getName() { return name; }

    @Override
    public double getBasePrice() { return price; }

    @Override
    public double getFinalPrice() { return price; }

    @Override
    public String getDescription() {
        return String.format("%s [Giá gốc: $%.2f]", name, price);
    }
}
