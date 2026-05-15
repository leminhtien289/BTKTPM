package exercise4.observer;

public class LibraryStaff implements LibraryObserver {
    private final String name;

    public LibraryStaff(String name) { this.name = name; }

    @Override
    public void onNotify(String event, String message) {
        System.out.printf("  [Nhân viên - %s] %s: %s%n", name, event, message);
    }

    @Override
    public String getName() { return name; }
}
