package exercise4.factory;

public class PhysicalBookCreator extends BookCreator {
    @Override
    public Book createBook(String title, String author, String genre) {
        return new PhysicalBook(title, author, genre);
    }
}
