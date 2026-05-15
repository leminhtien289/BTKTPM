package exercise4.factory;

public class EBook extends Book {
    public EBook(String title, String author, String genre) {
        super(title, author, genre);
    }

    @Override
    public String getType() { return "Sách điện tử"; }
}
