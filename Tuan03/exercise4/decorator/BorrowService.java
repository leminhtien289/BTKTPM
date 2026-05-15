package exercise4.decorator;

import exercise4.factory.Book;

public interface BorrowService {
    String borrow(Book book, String memberId);
    int getLoanDays();
    double getFee();
}
