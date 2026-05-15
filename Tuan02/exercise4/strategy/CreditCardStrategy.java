package exercise4.strategy;

public class CreditCardStrategy implements PaymentStrategy {
    private final String cardNumber;
    private final String holderName;

    public CreditCardStrategy(String cardNumber, String holderName) {
        this.cardNumber = cardNumber;
        this.holderName = holderName;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("  [CreditCard] Thanh toán $%.2f | Thẻ: %s | Chủ thẻ: %s%n",
                amount, maskCard(cardNumber), holderName);
        return true;
    }

    @Override
    public String getMethodName() { return "Thẻ tín dụng"; }

    private String maskCard(String card) {
        return "****-****-****-" + card.substring(card.length() - 4);
    }
}
