package exercise3.state;

import exercise3.Product;

// State Pattern - mỗi trạng thái phân loại quyết định quy tắc thuế riêng
public interface ProductTaxState {
    Product applyTaxDecorators(Product baseProduct); // kết hợp Decorator pattern
    String getCategoryName();
    String getTaxRuleDescription();
}
