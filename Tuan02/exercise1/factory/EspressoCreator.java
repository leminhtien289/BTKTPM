package exercise1.factory;

import exercise1.Coffee;
import exercise1.Espresso;

public class EspressoCreator extends CoffeeCreator {
    @Override
    public Coffee createCoffee() {
        return new Espresso();
    }
}
