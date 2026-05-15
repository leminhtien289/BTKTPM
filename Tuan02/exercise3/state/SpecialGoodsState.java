package exercise3.state;

import exercise3.Product;
import exercise3.decorator.VATDecorator;
import exercise3.decorator.ConsumptionTaxDecorator;

// Hàng đặc biệt (rượu, thuốc lá): Tiêu thụ đặc biệt 65% + VAT 10%
public class SpecialGoodsState implements ProductTaxState {
    @Override
    public Product applyTaxDecorators(Product base) {
        Product withConsumptionTax = new ConsumptionTaxDecorator(base, 0.65);
        return new VATDecorator(withConsumptionTax, 0.10);
    }

    @Override
    public String getCategoryName() { return "Hàng đặc biệt (rượu/thuốc lá)"; }

    @Override
    public String getTaxRuleDescription() { return "Tiêu thụ ĐB 65% + VAT 10%"; }
}
