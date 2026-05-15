package exercise2.decorator;

public class PushNotifier extends NotifierDecorator {
    private final String deviceId;

    public PushNotifier(Notifier notifier, String deviceId) {
        super(notifier);
        this.deviceId = deviceId;
    }

    @Override
    public void send(String message) {
        super.send(message);
        System.out.println("    [Push -> " + deviceId + "] " + message);
    }
}
