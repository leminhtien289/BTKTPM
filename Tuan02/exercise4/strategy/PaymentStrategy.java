package exercise4.strategy;

public interface PaymentStrategy {
    boolean pay(double amount);
    String getMethodName();
}
