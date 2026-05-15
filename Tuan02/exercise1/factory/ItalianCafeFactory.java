package exercise1.factory;

import exercise1.Coffee;
import exercise1.Food;
import exercise1.Espresso;
import exercise1.Croissant;

public class ItalianCafeFactory implements CafeBundleFactory {
    @Override
    public Coffee createCoffee() { return new Espresso(); }

    @Override
    public Food createFood() { return new Croissant(); }
}
