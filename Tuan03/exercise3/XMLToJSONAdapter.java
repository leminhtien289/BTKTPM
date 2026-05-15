package exercise3;

// Adapter - chuyển đổi JSON sang XML để XMLSystem có thể xử lý
public class XMLToJSONAdapter implements JSONProcessor {
    private final XMLSystem xmlSystem;

    public XMLToJSONAdapter(XMLSystem xmlSystem) {
        this.xmlSystem = xmlSystem;
    }

    @Override
    public void processJSON(String jsonData) {
        System.out.println("  [Adapter] Nhận JSON  : " + jsonData);
        String xmlData = convertJSONtoXML(jsonData);
        System.out.println("  [Adapter] Chuyển XML : " + xmlData);
        xmlSystem.processXML(xmlData);
    }

    // Chuyển đổi JSON đơn giản sang XML
    private String convertJSONtoXML(String json) {
        String result = json.trim()
                .replaceAll("^\\{", "<data>")
                .replaceAll("\\}$", "</data>")
                .replaceAll("\"(\\w+)\"\\s*:\\s*\"([^\"]+)\"", "<$1>$2</$1>")
                .replaceAll(",\\s*", "");
        return result;
    }
}
