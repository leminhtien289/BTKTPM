package exercise3.state;

import exercise3.Product;
import exercise3.decorator.VATDecorator;

// Hàng thiết yếu: chỉ VAT 5%
public class EssentialGoodsState implements ProductTaxState {
    @Override
    public Product applyTaxDecorators(Product base) {
        return new VATDecorator(base, 0.05);
    }

    @Override
    public String getCategoryName() { return "Hàng thiết yếu"; }

    @Override
    public String getTaxRuleDescription() { return "VAT 5%"; }
}
