package exercise4.decorator;

import exercise4.factory.Book;

public class ExtendTimeDecorator extends BorrowDecorator {
    private final int extraDays;

    public ExtendTimeDecorator(BorrowService service, int extraDays) {
        super(service);
        this.extraDays = extraDays;
    }

    @Override
    public int getLoanDays() { return service.getLoanDays() + extraDays; }

    @Override
    public double getFee() { return service.getFee() + extraDays * 0.5; }

    @Override
    public String borrow(Book book, String memberId) {
        return service.borrow(book, memberId)
                + String.format(" [+%d ngày gia hạn, phí thêm: $%.1f]", extraDays, extraDays * 0.5);
    }
}
