package exercise4.factory;

public class AudioBook extends Book {
    public AudioBook(String title, String author, String genre) {
        super(title, author, genre);
    }

    @Override
    public String getType() { return "Sách nói"; }
}
