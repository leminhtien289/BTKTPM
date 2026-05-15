package exercise4.factory;

// Factory Method - Product abstract class
public abstract class Book {
    protected final String title;
    protected final String author;
    protected final String genre;
    protected boolean available = true;

    public Book(String title, String author, String genre) {
        this.title = title;
        this.author = author;
        this.genre = genre;
    }

    public abstract String getType();

    public String getTitle()  { return title; }
    public String getAuthor() { return author; }
    public String getGenre()  { return genre; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    @Override
    public String toString() {
        return String.format("[%s] \"%s\" - %s | %s | %s",
                getType(), title, author, genre, available ? "Có sẵn" : "Đang mượn");
    }
}
