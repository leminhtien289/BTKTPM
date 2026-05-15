package exercise4.decorator;

import exercise4.factory.Book;

public abstract class BorrowDecorator implements BorrowService {
    protected final BorrowService service;

    public BorrowDecorator(BorrowService service) {
        this.service = service;
    }

    @Override
    public String borrow(Book book, String memberId) { return service.borrow(book, memberId); }

    @Override
    public int getLoanDays() { return service.getLoanDays(); }

    @Override
    public double getFee() { return service.getFee(); }
}
