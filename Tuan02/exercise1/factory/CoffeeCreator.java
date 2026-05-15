package exercise1.factory;

import exercise1.Coffee;

// Factory Method Pattern - Abstract Creator
public abstract class CoffeeCreator {
    public abstract Coffee createCoffee();

    public Coffee orderCoffee() {
        Coffee coffee = createCoffee();
        System.out.println("[FactoryMethod] Tạo: " + coffee);
        return coffee;
    }
}
