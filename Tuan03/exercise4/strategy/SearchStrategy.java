package exercise4.strategy;

import exercise4.factory.Book;
import java.util.List;

public interface SearchStrategy {
    List<Book> search(List<Book> books, String query);
    String getStrategyName();
}
