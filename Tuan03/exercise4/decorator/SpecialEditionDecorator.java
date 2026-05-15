package exercise4.decorator;

import exercise4.factory.Book;

public class SpecialEditionDecorator extends BorrowDecorator {
    public SpecialEditionDecorator(BorrowService service) {
        super(service);
    }

    @Override
    public double getFee() { return service.getFee() + 5.0; }

    @Override
    public String borrow(Book book, String memberId) {
        return service.borrow(book, memberId) + " [Phiên bản đặc biệt - bọc bảo vệ, $5.0]";
    }
}
