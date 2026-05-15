package exercise3.state;

import exercise3.Product;
import exercise3.decorator.VATDecorator;

// Hàng thông thường: VAT 10%
public class StandardGoodsState implements ProductTaxState {
    @Override
    public Product applyTaxDecorators(Product base) {
        return new VATDecorator(base, 0.10);
    }

    @Override
    public String getCategoryName() { return "Hàng thông thường"; }

    @Override
    public String getTaxRuleDescription() { return "VAT 10%"; }
}
