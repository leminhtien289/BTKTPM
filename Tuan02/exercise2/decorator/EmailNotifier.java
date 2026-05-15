package exercise2.decorator;

public class EmailNotifier extends NotifierDecorator {
    private final String email;

    public EmailNotifier(Notifier notifier, String email) {
        super(notifier);
        this.email = email;
    }

    @Override
    public void send(String message) {
        super.send(message);
        System.out.println("    [Email -> " + email + "] " + message);
    }
}
