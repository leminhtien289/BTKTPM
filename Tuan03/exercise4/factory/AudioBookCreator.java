package exercise4.factory;

public class AudioBookCreator extends BookCreator {
    @Override
    public Book createBook(String title, String author, String genre) {
        return new AudioBook(title, author, genre);
    }
}
