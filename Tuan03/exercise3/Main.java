package exercise3;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 3: Adapter Pattern                    ║");
        System.out.println("║  Scenario: JSON <-> XML System Integration      ║");
        System.out.println("╚══════════════════════════════════════════════════╝");

        XMLSystem xmlSystem = new XMLSystem();

        // ── Adapter 1: Web service gửi JSON, XMLSystem chỉ hiểu XML ──
        System.out.println("\n--- Adapter 1: JSON -> XML (client gửi JSON, hệ thống cần XML) ---");
        JSONProcessor adapter1 = new XMLToJSONAdapter(xmlSystem);

        adapter1.processJSON("{\"name\": \"Nguyen Van A\", \"age\": \"25\"}");
        System.out.println();
        adapter1.processJSON("{\"product\": \"Laptop\", \"price\": \"15000000\"}");

        // ── Adapter 2: Lấy dữ liệu từ XMLSystem, trả về JSON ──
        System.out.println("\n--- Adapter 2: XML -> JSON (hệ thống trả XML, client cần JSON) ---");
        JSONToXMLAdapter adapter2 = new JSONToXMLAdapter(xmlSystem);
        String json = adapter2.fetchAsJSON();
        System.out.println("  [Client] Nhận JSON: " + json);

        // ── Tổng kết vai trò Adapter ──
        System.out.println("\n--- Kết quả: Client và XMLSystem không cần thay đổi ---");
        System.out.println("  Client    : chỉ biết JSONProcessor interface");
        System.out.println("  XMLSystem : không thay đổi code gốc");
        System.out.println("  Adapter   : làm cầu nối giữa hai hệ thống bất tương thích");
    }
}
