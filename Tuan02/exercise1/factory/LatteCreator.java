package exercise1.factory;

import exercise1.Coffee;
import exercise1.Latte;

public class LatteCreator extends CoffeeCreator {
    @Override
    public Coffee createCoffee() {
        return new Latte();
    }
}
