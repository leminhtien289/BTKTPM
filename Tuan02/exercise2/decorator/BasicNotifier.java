package exercise2.decorator;

public class BasicNotifier implements Notifier {
    @Override
    public void send(String message) {
        System.out.println("    [Notifier] " + message);
    }
}
