package exercise4.observer;

public class LibraryMember implements LibraryObserver {
    private final String name;

    public LibraryMember(String name) { this.name = name; }

    @Override
    public void onNotify(String event, String message) {
        System.out.printf("  [Thành viên - %s] %s: %s%n", name, event, message);
    }

    @Override
    public String getName() { return name; }
}
