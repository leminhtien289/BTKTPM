package exercise2.decorator;

public class SMSNotifier extends NotifierDecorator {
    private final String phone;

    public SMSNotifier(Notifier notifier, String phone) {
        super(notifier);
        this.phone = phone;
    }

    @Override
    public void send(String message) {
        super.send(message);
        System.out.println("    [SMS -> " + phone + "] " + message);
    }
}
