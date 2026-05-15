package exercise3;

// Adapter chiều ngược lại - đọc XML từ XMLSystem và trả về JSON
public class JSONToXMLAdapter {
    private final XMLSystem xmlSystem;

    public JSONToXMLAdapter(XMLSystem xmlSystem) {
        this.xmlSystem = xmlSystem;
    }

    public String fetchAsJSON() {
        String xml = xmlSystem.fetchDataAsXML();
        System.out.println("  [Adapter] Nhận XML  : " + xml);
        String json = convertXMLtoJSON(xml);
        System.out.println("  [Adapter] Chuyển JSON: " + json);
        return json;
    }

    private String convertXMLtoJSON(String xml) {
        String body = xml.replaceAll("<[^/][^>]*>([^<]+)</[^>]+>", "\"$0\"")
                .replaceAll("<(\\w+)>([^<]+)</\\1>", "\"$1\": \"$2\"")
                .replaceAll("</?\\w+>", "");
        // Build simple JSON object
        String[] pairs = body.trim().split("\n");
        StringBuilder sb = new StringBuilder("{ ");
        for (int i = 0; i < pairs.length; i++) {
            String p = pairs[i].trim();
            if (!p.isEmpty()) {
                sb.append(p);
                if (i < pairs.length - 1) sb.append(", ");
            }
        }
        sb.append(" }");
        return sb.toString();
    }
}
