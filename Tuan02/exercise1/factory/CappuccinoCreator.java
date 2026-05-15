package exercise1.factory;

import exercise1.Coffee;
import exercise1.Cappuccino;

public class CappuccinoCreator extends CoffeeCreator {
    @Override
    public Coffee createCoffee() {
        return new Cappuccino();
    }
}
