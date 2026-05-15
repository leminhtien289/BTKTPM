package exercise2;

import java.util.ArrayList;
import java.util.List;

// Concrete Subject - cổ phiếu
public class Stock implements Subject {
    private final String symbol;
    private double price;
    private final List<Observer> observers = new ArrayList<>();

    public Stock(String symbol, double initialPrice) {
        this.symbol = symbol;
        this.price = initialPrice;
    }

    @Override
    public void subscribe(Observer observer) {
        observers.add(observer);
        System.out.println("[Stock] " + observer.getName() + " đã đăng ký theo dõi " + symbol);
    }

    @Override
    public void unsubscribe(Observer observer) {
        observers.remove(observer);
        System.out.println("[Stock] " + observer.getName() + " hủy theo dõi " + symbol);
    }

    @Override
    public void notifyObservers(String event, String message) {
        for (Observer o : observers) {
            o.update(event, message);
        }
    }

    public void setPrice(double newPrice) {
        double old = this.price;
        this.price = newPrice;
        double change = ((newPrice - old) / old) * 100;
        String msg = String.format("%s: $%.2f -> $%.2f (%+.1f%%)", symbol, old, newPrice, change);
        System.out.println("\n[Stock] Giá thay đổi: " + msg);
        notifyObservers("PRICE_CHANGE", msg);
    }

    public String getSymbol() { return symbol; }
    public double getPrice() { return price; }
}
