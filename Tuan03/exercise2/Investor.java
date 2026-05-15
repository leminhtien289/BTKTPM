package exercise2;

// Concrete Observer - nhà đầu tư theo dõi cổ phiếu
public class Investor implements Observer {
    private final String name;

    public Investor(String name) {
        this.name = name;
    }

    @Override
    public void update(String event, String message) {
        System.out.println("  [Investor - " + name + "] Nhận thông báo: " + message);
    }

    @Override
    public String getName() { return name; }
}
