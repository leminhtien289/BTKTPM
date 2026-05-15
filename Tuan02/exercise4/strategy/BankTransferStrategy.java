package exercise4.strategy;

public class BankTransferStrategy implements PaymentStrategy {
    private final String accountNumber;
    private final String bankName;

    public BankTransferStrategy(String accountNumber, String bankName) {
        this.accountNumber = accountNumber;
        this.bankName = bankName;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("  [BankTransfer] Chuyển khoản $%.2f | TK: %s | Ngân hàng: %s%n",
                amount, accountNumber, bankName);
        return true;
    }

    @Override
    public String getMethodName() { return "Chuyển khoản " + bankName; }
}
