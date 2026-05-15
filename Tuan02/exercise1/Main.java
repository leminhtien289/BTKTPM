package exercise1;

import exercise1.singleton.CoffeeShopManager;
import exercise1.factory.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔═══════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 1: Singleton + Factory Patterns        ║");
        System.out.println("║  Scenario: Coffee Shop Management System         ║");
        System.out.println("╚═══════════════════════════════════════════════════╝");

        // Singleton - xác nhận chỉ có một instance duy nhất
        System.out.println("\n--- Singleton Pattern ---");
        CoffeeShopManager manager1 = CoffeeShopManager.getInstance();
        CoffeeShopManager manager2 = CoffeeShopManager.getInstance();
        System.out.println("manager1 == manager2: " + (manager1 == manager2));

        // Factory Method - mỗi Creator tạo một loại Coffee cụ thể
        System.out.println("\n--- Factory Method Pattern ---");
        CoffeeCreator[] creators = {
            new EspressoCreator(), new LatteCreator(), new CappuccinoCreator()
        };
        for (CoffeeCreator creator : creators) {
            Coffee coffee = creator.orderCoffee();
            manager1.placeOrder(coffee);
        }

        // Abstract Factory - tạo combo theo phong cách vùng miền
        System.out.println("\n--- Abstract Factory Pattern ---");
        CafeBundleFactory italianFactory = new ItalianCafeFactory();
        CafeBundleFactory americanFactory = new AmericanCafeFactory();

        System.out.print("Italian Style: ");
        italianFactory.displayBundle();
        System.out.print("American Style: ");
        americanFactory.displayBundle();

        manager1.placeOrder(italianFactory.createCoffee(), italianFactory.createFood());
        manager1.placeOrder(americanFactory.createCoffee(), americanFactory.createFood());

        manager1.printAllOrders();
    }
}
