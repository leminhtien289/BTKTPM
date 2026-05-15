package exercise3;

// Adaptee - hệ thống cũ chỉ hỗ trợ XML, không thay đổi được
public class XMLSystem {
    public void processXML(String xmlData) {
        System.out.println("  [XMLSystem] Xử lý XML: " + xmlData);
    }

    public String fetchDataAsXML() {
        return "<user><name>Nguyen Van A</name><age>25</age><email>user@example.com</email></user>";
    }
}
