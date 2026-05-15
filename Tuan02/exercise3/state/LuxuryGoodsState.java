package exercise3.state;

import exercise3.Product;
import exercise3.decorator.VATDecorator;
import exercise3.decorator.ConsumptionTaxDecorator;

// Hàng xa xỉ: Tiêu thụ đặc biệt 20% + VAT 10%
public class LuxuryGoodsState implements ProductTaxState {
    @Override
    public Product applyTaxDecorators(Product base) {
        Product withConsumptionTax = new ConsumptionTaxDecorator(base, 0.20);
        return new VATDecorator(withConsumptionTax, 0.10);
    }

    @Override
    public String getCategoryName() { return "Hàng xa xỉ"; }

    @Override
    public String getTaxRuleDescription() { return "Tiêu thụ ĐB 20% + VAT 10%"; }
}
