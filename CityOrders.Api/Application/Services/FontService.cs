using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Drawing;

namespace CityOrders.Api.Application.Services;

public static class FontService
{
    private static readonly string FontsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Fonts");
    private static bool _fontsRegistered = false;

    public static void RegisterFonts()
    {
        if (_fontsRegistered) return;

        try
        {
            // Try to register Cairo font (preferred)
            var cairoRegular = Path.Combine(FontsPath, "Cairo-Regular.ttf");
            var cairoBold = Path.Combine(FontsPath, "Cairo-Bold.ttf");

            if (File.Exists(cairoRegular))
            {
                using var stream = File.OpenRead(cairoRegular);
                FontManager.RegisterFont(stream);
                Console.WriteLine($"✓ Registered Cairo-Regular font from {cairoRegular}");
            }

            if (File.Exists(cairoBold))
            {
                using var stream = File.OpenRead(cairoBold);
                FontManager.RegisterFont(stream);
                Console.WriteLine($"✓ Registered Cairo-Bold font from {cairoBold}");
            }

            // Try to register Amiri font (alternative)
            var amiriRegular = Path.Combine(FontsPath, "Amiri-Regular.ttf");
            var amiriBold = Path.Combine(FontsPath, "Amiri-Bold.ttf");

            if (File.Exists(amiriRegular))
            {
                using var stream = File.OpenRead(amiriRegular);
                FontManager.RegisterFont(stream);
                Console.WriteLine($"✓ Registered Amiri-Regular font from {amiriRegular}");
            }

            if (File.Exists(amiriBold))
            {
                using var stream = File.OpenRead(amiriBold);
                FontManager.RegisterFont(stream);
                Console.WriteLine($"✓ Registered Amiri-Bold font from {amiriBold}");
            }

            // If no Arabic fonts found, log warning
            if (!File.Exists(cairoRegular) && !File.Exists(amiriRegular))
            {
                Console.WriteLine($"⚠ Warning: No Arabic fonts found in {FontsPath}");
                Console.WriteLine($"⚠ Arabic text may not render correctly in PDFs");
                Console.WriteLine($"⚠ Please add Cairo-Regular.ttf or Amiri-Regular.ttf to {FontsPath}");
            }

            _fontsRegistered = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error registering fonts: {ex.Message}");
        }
    }

    public static string GetFontFamily(string lang)
    {
        // Check if Cairo font exists
        var cairoRegular = Path.Combine(FontsPath, "Cairo-Regular.ttf");
        if (File.Exists(cairoRegular))
        {
            return "Cairo";
        }

        // Check if Amiri font exists
        var amiriRegular = Path.Combine(FontsPath, "Amiri-Regular.ttf");
        if (File.Exists(amiriRegular))
        {
            return "Amiri";
        }

        // Fallback to system default
        // For Arabic, we'll use whatever is available
        return lang?.ToLower() == "ar" ? "Arial" : "Lato";
    }
}
