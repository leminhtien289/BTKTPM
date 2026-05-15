package exercise4.factory;

public class PhysicalBook extends Book {
    public PhysicalBook(String title, String author, String genre) {
        super(title, author, genre);
    }

    @Override
    public String getType() { return "Sách giấy"; }
}
