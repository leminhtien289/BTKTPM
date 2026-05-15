package exercise4.factory;

public class EBookCreator extends BookCreator {
    @Override
    public Book createBook(String title, String author, String genre) {
        return new EBook(title, author, genre);
    }
}
