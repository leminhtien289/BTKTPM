package exercise1;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔═══════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 1: Composite Pattern               ║");
        System.out.println("║  Scenario: File System Tree Structure        ║");
        System.out.println("╚═══════════════════════════════════════════════╝");

        // Tạo cây thư mục
        FolderComposite root = new FolderComposite("D:/Projects");

        // Folder: src
        FolderComposite src = new FolderComposite("src");
        src.add(new FileLeaf("Main.java", 12));
        src.add(new FileLeaf("App.java", 8));

        FolderComposite components = new FolderComposite("components");
        components.add(new FileLeaf("Button.java", 5));
        components.add(new FileLeaf("Dialog.java", 7));
        components.add(new FileLeaf("Navbar.java", 6));
        src.add(components);

        // Folder: resources
        FolderComposite resources = new FolderComposite("resources");
        resources.add(new FileLeaf("config.xml", 3));
        resources.add(new FileLeaf("messages.properties", 2));

        FolderComposite images = new FolderComposite("images");
        images.add(new FileLeaf("logo.png", 45));
        images.add(new FileLeaf("banner.jpg", 120));
        resources.add(images);

        // Folder: docs
        FolderComposite docs = new FolderComposite("docs");
        docs.add(new FileLeaf("README.md", 4));
        docs.add(new FileLeaf("API.md", 9));

        root.add(src);
        root.add(resources);
        root.add(docs);
        root.add(new FileLeaf("pom.xml", 3));
        root.add(new FileLeaf(".gitignore", 1));

        // Hiển thị cây thư mục
        System.out.println("\n--- Cây thư mục ---");
        root.display("");

        // Composite cho phép xử lý đồng nhất folder và file
        System.out.println("\n--- Kích thước từng phần ---");
        System.out.println("src/          : " + src.getSize() + " KB");
        System.out.println("resources/    : " + resources.getSize() + " KB");
        System.out.println("images/       : " + images.getSize() + " KB");
        System.out.println("Tổng dự án    : " + root.getSize() + " KB");
    }
}
