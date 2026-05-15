package exercise4.factory;

// Factory Method - Abstract Creator
public abstract class BookCreator {
    public abstract Book createBook(String title, String author, String genre);

    public Book newBook(String title, String author, String genre) {
        Book book = createBook(title, author, genre);
        System.out.println("[Factory] Tạo sách mới: " + book);
        return book;
    }
}
