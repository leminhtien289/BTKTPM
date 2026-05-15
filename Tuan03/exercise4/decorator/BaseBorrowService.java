package exercise4.decorator;

import exercise4.factory.Book;

public class BaseBorrowService implements BorrowService {
    @Override
    public String borrow(Book book, String memberId) {
        book.setAvailable(false);
        return String.format("Mượn \"%s\" | Thành viên: %s | %d ngày | Phí: $%.2f",
                book.getTitle(), memberId, getLoanDays(), getFee());
    }

    @Override
    public int getLoanDays() { return 14; }

    @Override
    public double getFee() { return 0.0; }
}
