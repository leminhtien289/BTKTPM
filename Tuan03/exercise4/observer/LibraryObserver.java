package exercise4.observer;

public interface LibraryObserver {
    void onNotify(String event, String message);
    String getName();
}
