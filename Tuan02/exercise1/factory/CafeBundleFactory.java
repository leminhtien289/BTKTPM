package exercise1.factory;

import exercise1.Coffee;
import exercise1.Food;

// Abstract Factory Pattern - tạo combo cà phê + đồ ăn theo phong cách vùng miền
public interface CafeBundleFactory {
    Coffee createCoffee();
    Food createFood();

    default void displayBundle() {
        Coffee coffee = createCoffee();
        Food food = createFood();
        System.out.printf("[AbstractFactory] Bundle: %s + %s = $%.1f%n",
                coffee, food, coffee.getPrice() + food.getPrice());
    }
}
