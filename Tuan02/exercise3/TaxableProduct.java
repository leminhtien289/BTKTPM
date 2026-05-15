package exercise3;

import exercise3.state.ProductTaxState;
import exercise3.state.EssentialGoodsState;
import exercise3.state.StandardGoodsState;
import exercise3.state.LuxuryGoodsState;

// Context class cho State pattern - sản phẩm có thể được tái phân loại
public class TaxableProduct {
    private final String name;
    private final double basePrice;
    private ProductTaxState state;

    public TaxableProduct(String name, double basePrice) {
        this.name = name;
        this.basePrice = basePrice;
        // Tự động phân loại ban đầu dựa trên giá
        autoClassify();
    }

    // State transition - tự động phân loại theo giá
    private void autoClassify() {
        if (basePrice <= 50) {
            this.state = new EssentialGoodsState();
        } else if (basePrice <= 500) {
            this.state = new StandardGoodsState();
        } else {
            this.state = new LuxuryGoodsState();
        }
        System.out.println("[State] Tự động phân loại '" + name + "' -> " + state.getCategoryName()
                + " (" + state.getTaxRuleDescription() + ")");
    }

    // State transition - tái phân loại thủ công (ví dụ: cơ quan thuế quyết định)
    public void reclassify(ProductTaxState newState) {
        System.out.println("[State] Tái phân loại '" + name + "': "
                + state.getCategoryName() + " -> " + newState.getCategoryName()
                + " (" + newState.getTaxRuleDescription() + ")");
        this.state = newState;
    }

    // State quyết định Decorator nào được áp dụng
    public double computeFinalPrice() {
        Product base = new BaseProduct(name, basePrice);
        Product taxed = state.applyTaxDecorators(base); // Decorator pattern
        return taxed.getFinalPrice();
    }

    public String computeDescription() {
        Product base = new BaseProduct(name, basePrice);
        Product taxed = state.applyTaxDecorators(base); // Decorator pattern
        return taxed.getDescription();
    }

    public String getCurrentCategory() { return state.getCategoryName(); }
    public String getName() { return name; }
    public double getBasePrice() { return basePrice; }
}
