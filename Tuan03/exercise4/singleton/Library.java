package exercise4.singleton;

import exercise4.factory.Book;
import exercise4.observer.LibraryObserver;
import exercise4.strategy.SearchStrategy;

import java.util.ArrayList;
import java.util.List;

// Singleton Pattern + Subject (Observer Pattern)
public class Library {
    private static Library instance;
    private final List<Book> books = new ArrayList<>();
    private final List<LibraryObserver> observers = new ArrayList<>();

    private Library() {}

    public static Library getInstance() {
        if (instance == null) {
            instance = new Library();
        }
        return instance;
    }

    // Observer - đăng ký / hủy
    public void subscribe(LibraryObserver observer) {
        observers.add(observer);
        System.out.println("[Library] " + observer.getName() + " đã đăng ký nhận thông báo.");
    }

    public void unsubscribe(LibraryObserver observer) {
        observers.remove(observer);
    }

    private void notifyObservers(String event, String message) {
        for (LibraryObserver o : observers) {
            o.onNotify(event, message);
        }
    }

    // Factory - thêm sách và thông báo
    public void addBook(Book book) {
        books.add(book);
        notifyObservers("SACH_MOI", book.getTitle() + " [" + book.getType() + "] - " + book.getAuthor());
    }

    // Strategy - tìm kiếm linh hoạt
    public List<Book> search(SearchStrategy strategy, String query) {
        List<Book> results = strategy.search(books, query);
        System.out.printf("[Library] %s \"%s\" -> %d kết quả%n",
                strategy.getStrategyName(), query, results.size());
        return results;
    }

    // Mượn / trả sách
    public void returnBook(Book book) {
        book.setAvailable(true);
        notifyObservers("TRA_SACH", "Sách đã được trả: " + book.getTitle());
    }

    public List<Book> getAllBooks() { return books; }

    public void printCatalog() {
        System.out.println("\n--- Danh mục thư viện (" + books.size() + " cuốn) ---");
        books.forEach(b -> System.out.println("  " + b));
    }
}
