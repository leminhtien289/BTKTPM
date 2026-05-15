package exercise3;

import exercise3.state.*;
import exercise3.strategy.*;
import exercise3.decorator.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔═══════════════════════════════════════════════════════╗");
        System.out.println("║  EXERCISE 3: Tax Calculation System                  ║");
        System.out.println("║  Patterns: State + Strategy + Decorator              ║");
        System.out.println("╚═══════════════════════════════════════════════════════╝");

        // ─────────────────────────────────────────────────────────────
        // STATE PATTERN: Phân loại sản phẩm -> quyết định quy tắc thuế
        // ─────────────────────────────────────────────────────────────
        System.out.println("\n══════ STATE PATTERN: Phân loại sản phẩm ══════");

        // Tự động phân loại theo giá
        TaxableProduct rice   = new TaxableProduct("Gạo ST25 (5kg)", 15.0);
        TaxableProduct laptop = new TaxableProduct("Laptop Dell", 400.0);
        TaxableProduct phone  = new TaxableProduct("iPhone 15 Pro", 1000.0);

        System.out.println();
        printProduct(rice);
        printProduct(laptop);
        printProduct(phone);

        // State transition - tái phân loại khi cơ quan thuế quyết định
        System.out.println("\n--- Tái phân loại (State transition) ---");
        phone.reclassify(new SpecialGoodsState());
        printProduct(phone);

        laptop.reclassify(new EssentialGoodsState());
        printProduct(laptop);

        // ─────────────────────────────────────────────────────────────
        // STRATEGY PATTERN: Đổi thuật toán tính thuế linh hoạt
        // ─────────────────────────────────────────────────────────────
        System.out.println("\n══════ STRATEGY PATTERN: Tính thuế linh hoạt ══════");
        TaxCalculator calculator = new TaxCalculator(new NoTaxStrategy());
        double price = 1000.0;
        System.out.println("Giá gốc: $" + price);

        calculator.setStrategy(new NoTaxStrategy());
        calculator.calculateTotal(price);

        calculator.setStrategy(new VATStrategy(0.10));
        calculator.calculateTotal(price);

        calculator.setStrategy(new ConsumptionTaxStrategy(0.05));
        calculator.calculateTotal(price);

        // ─────────────────────────────────────────────────────────────
        // DECORATOR PATTERN: Chồng nhiều lớp thuế lên sản phẩm
        // ─────────────────────────────────────────────────────────────
        System.out.println("\n══════ DECORATOR PATTERN: Chồng nhiều lớp thuế ══════");

        Product whisky = new BaseProduct("Whisky 12Y", 200.0);
        System.out.println("Gốc:               " + whisky.getDescription()
                + String.format(" -> $%.2f", whisky.getFinalPrice()));

        Product step1 = new ConsumptionTaxDecorator(whisky, 0.65);
        System.out.printf("+ TiêuThụ ĐB 65%%: %s -> $%.2f%n",
                step1.getDescription(), step1.getFinalPrice());

        Product step2 = new VATDecorator(step1, 0.10);
        System.out.printf("+ VAT 10%%:         %s -> $%.2f%n",
                step2.getDescription(), step2.getFinalPrice());
    }

    private static void printProduct(TaxableProduct p) {
        System.out.printf("  %-20s | Gốc: $%7.2f | Loại: %-22s | Cuối: $%8.2f%n",
                p.getName(), p.getBasePrice(), p.getCurrentCategory(), p.computeFinalPrice());
    }
}
