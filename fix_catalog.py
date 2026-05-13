import re

path = r'd:\api\CityOrders.Api\API\Controllers\CatalogController.cs'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the visibility check
pattern = r'(b\.MerchantProfile\.IsActive\s+&&)\s+(_context\.MerchantShifts\.Any)'
replacement = r'\1\n                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&\n                            \2'

# We want to replace where it DOES NOT already have the temporary close check
# But since Regex can be tricky with multiline, let's do a more robust replacement

# Correct logic for line 37 was already applied, but might have different spacing.
# Actually, let's just replace all occurrences of the "standard" 3-line check with 4-line check.

new_content = re.sub(
    r'(b\.MerchantProfile\.IsActive\s+&&\n\s+)(_context\.MerchantShifts\.Any)',
    r'\1(!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&\n                            \2',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated CatalogController")
