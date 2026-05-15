package exercise1;

// Composite Pattern - Leaf (file, không có con)
public class FileLeaf implements FileSystemComponent {
    private final String name;
    private final long size;

    public FileLeaf(String name, long size) {
        this.name = name;
        this.size = size;
    }

    @Override
    public String getName() { return name; }

    @Override
    public long getSize() { return size; }

    @Override
    public void display(String indent) {
        System.out.printf("%s[File] %-25s %5d KB%n", indent, name, size);
    }
}
