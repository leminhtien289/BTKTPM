package exercise1;

import java.util.ArrayList;
import java.util.List;

// Composite Pattern - Composite (folder, có thể chứa con)
public class FolderComposite implements FileSystemComponent {
    private final String name;
    private final List<FileSystemComponent> children = new ArrayList<>();

    public FolderComposite(String name) {
        this.name = name;
    }

    public void add(FileSystemComponent component) {
        children.add(component);
    }

    public void remove(FileSystemComponent component) {
        children.remove(component);
    }

    @Override
    public String getName() { return name; }

    @Override
    public long getSize() {
        return children.stream().mapToLong(FileSystemComponent::getSize).sum();
    }

    @Override
    public void display(String indent) {
        System.out.printf("%s[Folder] %-23s %5d KB%n", indent, name + "/", getSize());
        for (FileSystemComponent child : children) {
            child.display(indent + "  |-- ");
        }
    }
}
