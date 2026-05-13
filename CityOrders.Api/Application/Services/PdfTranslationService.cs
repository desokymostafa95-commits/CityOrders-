namespace CityOrders.Api.Application.Services;

public static class PdfTranslationService
{
    private static readonly Dictionary<string, Dictionary<string, string>> Translations = new()
    {
        ["en"] = new Dictionary<string, string>
        {
            ["invoice"] = "Invoice",
            ["invoice_number"] = "Invoice Number",
            ["period"] = "Period",
            ["to"] = "To",
            ["closed_at"] = "Closed At",
            ["orders"] = "Orders",
            ["gross_sales"] = "Gross Sales",
            ["items"] = "Items",
            ["product"] = "Product",
            ["qty"] = "Qty",
            ["price"] = "Price",
            ["total"] = "Total",
            ["order_hash"] = "Order #",
            ["delivered"] = "Delivered",
            ["brand"] = "Brand",
            ["address"] = "Address",
            ["phone"] = "Phone",
            ["subtotal"] = "Subtotal",
            ["page"] = "Page",
            ["of"] = "of",
            ["and"] = "and",
            ["more"] = "more"
        },
        ["ar"] = new Dictionary<string, string>
        {
            ["invoice"] = "فاتورة",
            ["invoice_number"] = "رقم الفاتورة",
            ["period"] = "الفترة",
            ["to"] = "إلى",
            ["closed_at"] = "أغلقت في",
            ["orders"] = "الطلبات",
            ["gross_sales"] = "إجمالي المبيعات",
            ["items"] = "الأصناف",
            ["product"] = "المنتج",
            ["qty"] = "الكمية",
            ["price"] = "السعر",
            ["total"] = "الإجمالي",
            ["order_hash"] = "رقم الطلب",
            ["delivered"] = "تم التوصيل",
            ["brand"] = "المتجر",
            ["address"] = "العنوان",
            ["phone"] = "الهاتف",
            ["subtotal"] = "المجموع الفرعي",
            ["page"] = "صفحة",
            ["of"] = "من",
            ["and"] = "و",
            ["more"] = "أكثر"
        }
    };

    public static string T(string key, string lang = "en")
    {
        lang = lang?.ToLower() ?? "en";
        if (!Translations.ContainsKey(lang)) lang = "en";
        
        return Translations[lang].TryGetValue(key, out var value) ? value : key;
    }

    public static bool IsRtl(string lang) => lang?.ToLower() == "ar";
}
