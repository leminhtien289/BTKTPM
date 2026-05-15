package exercise1.singleton;

import exercise1.Coffee;
import exercise1.Food;
import java.util.ArrayList;
import java.util.List;

// Singleton Pattern - chỉ một manager duy nhất quản lý toàn bộ quán
public class CoffeeShopManager {
    private static CoffeeShopManager instance;
    private final List<String> orders = new ArrayList<>();
    private int orderCount = 0;

    private CoffeeShopManager() {}

    public static CoffeeShopManager getInstance() {
        if (instance == null) {
            instance = new CoffeeShopManager();
        }
        return instance;
    }

    public void placeOrder(Coffee coffee, Food food) {
        orderCount++;
        String order = String.format("#%d: %s + %s ($%.1f)",
                orderCount, coffee.getName(), food.getName(),
                coffee.getPrice() + food.getPrice());
        orders.add(order);
        System.out.println("[Manager] Đặt đơn thành công: " + order);
    }

    public void placeOrder(Coffee coffee) {
        orderCount++;
        String order = String.format("#%d: %s ($%.1f)", orderCount, coffee.getName(), coffee.getPrice());
        orders.add(order);
        System.out.println("[Manager] Đặt đơn thành công: " + order);
    }

    public void printAllOrders() {
        System.out.println("\n=== Tất cả đơn hàng ===");
        orders.forEach(System.out::println);
        System.out.println("Tổng số đơn: " + orderCount);
    }
}
