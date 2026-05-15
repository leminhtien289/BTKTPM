package exercise4.strategy;

import exercise4.factory.Book;
import java.util.List;
import java.util.stream.Collectors;

public class SearchByGenre implements SearchStrategy {
    @Override
    public List<Book> search(List<Book> books, String query) {
        return books.stream()
                .filter(b -> b.getGenre().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
    }

    @Override
    public String getStrategyName() { return "Tìm theo thể loại"; }
}
