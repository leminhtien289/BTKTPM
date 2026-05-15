package exercise2;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 2: Observer Pattern                 ║");
        System.out.println("║  Scenario 1: Stock Price | Scenario 2: Tasks  ║");
        System.out.println("╚════════════════════════════════════════════════╝");

        // ── Scenario 1: Theo dõi giá cổ phiếu ──
        System.out.println("\n══════ Scenario 1: Stock Price Tracker ══════");

        Stock vnm = new Stock("VNM", 85000);
        Stock fpt = new Stock("FPT", 120000);

        Investor alice = new Investor("Alice");
        Investor bob   = new Investor("Bob");
        Investor carol = new Investor("Carol");

        vnm.subscribe(alice);
        vnm.subscribe(bob);
        fpt.subscribe(bob);
        fpt.subscribe(carol);

        vnm.setPrice(87500);  // Alice + Bob nhận thông báo
        fpt.setPrice(115000); // Bob + Carol nhận thông báo

        // Bob hủy theo dõi VNM
        vnm.unsubscribe(bob);
        vnm.setPrice(90000);  // Chỉ Alice nhận

        // ── Scenario 2: Task Management ──
        System.out.println("\n══════ Scenario 2: Project Task Management ══════");

        ProjectTask task1 = new ProjectTask("TASK-01", "Thiết kế database");
        ProjectTask task2 = new ProjectTask("TASK-02", "Viết API đăng nhập");

        TeamMember dev1 = new TeamMember("Nguyễn An", "Developer");
        TeamMember dev2 = new TeamMember("Trần Bình", "Developer");
        TeamMember pm   = new TeamMember("Lê Châu", "PM");

        // PM và tất cả dev theo dõi task
        task1.subscribe(dev1);
        task1.subscribe(pm);
        task2.subscribe(dev2);
        task2.subscribe(pm);

        task1.assign("Nguyễn An");
        task1.updateStatus("IN_PROGRESS");
        task1.updateStatus("REVIEW");
        task1.updateStatus("DONE");

        task2.assign("Trần Bình");
        task2.updateStatus("IN_PROGRESS");
    }
}
