using System.Security.Cryptography;
using System.Text;

namespace CityOrders.Api.Infrastructure.Data
{
    public static class PasswordHasher
    {
        private const int SaltSize = 16;
        private const int KeySize = 32;
        private const int Iterations = 100_000;
        private const string CurrentFormat = "PBKDF2";

        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            return $"{CurrentFormat}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public static bool VerifyPassword(string password, string hash)
        {
            if (hash.StartsWith($"{CurrentFormat}$", StringComparison.Ordinal))
            {
                return VerifyCurrentHash(password, hash);
            }

            return VerifyLegacySha256Hash(password, hash);
        }

        private static bool VerifyCurrentHash(string password, string storedHash)
        {
            var parts = storedHash.Split('$');
            if (parts.Length != 4 || parts[0] != CurrentFormat)
            {
                return false;
            }

            if (!int.TryParse(parts[1], out var iterations) || iterations <= 0)
            {
                return false;
            }

            try
            {
                var salt = Convert.FromBase64String(parts[2]);
                var expectedHash = Convert.FromBase64String(parts[3]);
                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private static bool VerifyLegacySha256Hash(string password, string storedHash)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var legacyHash = Convert.ToBase64String(bytes);

            var actual = Encoding.UTF8.GetBytes(legacyHash);
            var expected = Encoding.UTF8.GetBytes(storedHash);

            return actual.Length == expected.Length && CryptographicOperations.FixedTimeEquals(actual, expected);
        }
    }
}
