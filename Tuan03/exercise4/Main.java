package exercise4;

import exercise4.singleton.Library;
import exercise4.factory.*;
import exercise4.strategy.*;
import exercise4.observer.*;
import exercise4.decorator.*;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 4: Library Management System                  ║");
        System.out.println("║  Patterns: Singleton + Factory + Strategy + Observer    ║");
        System.out.println("║            + Decorator                                  ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");

        // ── 1. SINGLETON ──
        System.out.println("\n══════ 1. Singleton ══════");
        Library lib1 = Library.getInstance();
        Library lib2 = Library.getInstance();
        System.out.println("lib1 == lib2: " + (lib1 == lib2));
        Library library = lib1;

        // ── 2. OBSERVER - đăng ký trước khi thêm sách ──
        System.out.println("\n══════ 2. Observer - Đăng ký nhận thông báo ══════");
        LibraryStaff staff1  = new LibraryStaff("Minh");
        LibraryStaff staff2  = new LibraryStaff("Hoa");
        LibraryMember member = new LibraryMember("Tuấn");
        library.subscribe(staff1);
        library.subscribe(staff2);
        library.subscribe(member);

        // ── 3. FACTORY METHOD - tạo sách ──
        System.out.println("\n══════ 3. Factory Method - Thêm sách mới ══════");
        BookCreator physicalCreator = new PhysicalBookCreator();
        BookCreator ebookCreator    = new EBookCreator();
        BookCreator audioCreator    = new AudioBookCreator();

        Book b1 = physicalCreator.newBook("Đắc Nhân Tâm", "Dale Carnegie", "Kỹ năng sống");
        Book b2 = physicalCreator.newBook("Nhà Giả Kim", "Paulo Coelho", "Tiểu thuyết");
        Book b3 = ebookCreator.newBook("Clean Code", "Robert Martin", "Lập trình");
        Book b4 = ebookCreator.newBook("Design Patterns", "Gang of Four", "Lập trình");
        Book b5 = audioCreator.newBook("Sapiens", "Yuval Noah Harari", "Lịch sử");

        // Observer tự động nhận thông báo khi addBook
        System.out.println("\n--- Thêm vào thư viện (Observer sẽ nhận thông báo) ---");
        library.addBook(b1);
        library.addBook(b2);
        library.addBook(b3);
        library.addBook(b4);
        library.addBook(b5);

        library.printCatalog();

        // ── 4. STRATEGY - tìm kiếm ──
        System.out.println("\n══════ 4. Strategy - Tìm kiếm sách ══════");
        List<Book> r1 = library.search(new SearchByTitle(),  "clean");
        r1.forEach(b -> System.out.println("  -> " + b));

        List<Book> r2 = library.search(new SearchByAuthor(), "coelho");
        r2.forEach(b -> System.out.println("  -> " + b));

        List<Book> r3 = library.search(new SearchByGenre(),  "lập trình");
        r3.forEach(b -> System.out.println("  -> " + b));

        // ── 5. DECORATOR - mượn sách với tính năng bổ sung ──
        System.out.println("\n══════ 5. Decorator - Mượn sách ══════");

        // Mượn cơ bản
        BorrowService basic = new BaseBorrowService();
        System.out.println("[Cơ bản]    " + basic.borrow(b3, "MEM-001"));

        // Mượn + gia hạn 7 ngày
        BorrowService extended = new ExtendTimeDecorator(new BaseBorrowService(), 7);
        System.out.println("[Gia hạn]   " + extended.borrow(b4, "MEM-002"));

        // Mượn + phiên bản đặc biệt + gia hạn
        BorrowService premium = new SpecialEditionDecorator(
                new ExtendTimeDecorator(new BaseBorrowService(), 14));
        System.out.println("[Premium]   " + premium.borrow(b1, "MEM-003"));

        // Observer thông báo khi trả sách
        System.out.println("\n--- Trả sách (Observer nhận thông báo) ---");
        library.returnBook(b3);
    }
}
