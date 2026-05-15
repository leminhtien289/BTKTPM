package exercise1.factory;

import exercise1.Coffee;
import exercise1.Food;
import exercise1.Latte;
import exercise1.Muffin;

public class AmericanCafeFactory implements CafeBundleFactory {
    @Override
    public Coffee createCoffee() { return new Latte(); }

    @Override
    public Food createFood() { return new Muffin(); }
}
