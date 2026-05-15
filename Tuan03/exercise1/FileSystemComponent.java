package exercise1;

// Composite Pattern - Component interface
public interface FileSystemComponent {
    String getName();
    long getSize();
    void display(String indent);
}
