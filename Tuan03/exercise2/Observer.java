package exercise2;

public interface Observer {
    void update(String event, String message);
    String getName();
}
