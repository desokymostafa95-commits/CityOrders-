using CityOrders.Api.Domain.Entities;

namespace CityOrders.Api.Application.Services
{
    /// <summary>
    /// Calculates delivery fees based on distance using the Haversine formula
    /// </summary>
    public static class DeliveryFeeCalculator
    {
        private const double EarthRadiusMeters = 6371000;

        /// <summary>
        /// Calculates distance between two points using Haversine formula
        /// </summary>
        /// <param name="lat1">Latitude of point 1 (degrees)</param>
        /// <param name="lng1">Longitude of point 1 (degrees)</param>
        /// <param name="lat2">Latitude of point 2 (degrees)</param>
        /// <param name="lng2">Longitude of point 2 (degrees)</param>
        /// <returns>Distance in meters</returns>
        public static int CalculateDistanceMeters(decimal lat1, decimal lng1, decimal lat2, decimal lng2)
        {
            var lat1Rad = ToRadians((double)lat1);
            var lat2Rad = ToRadians((double)lat2);
            var deltaLat = ToRadians((double)(lat2 - lat1));
            var deltaLng = ToRadians((double)(lng2 - lng1));

            var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(deltaLng / 2) * Math.Sin(deltaLng / 2);
            
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = EarthRadiusMeters * c;

            return (int)Math.Round(distance);
        }

        /// <summary>
        /// Calculates delivery fee based on brand pricing configuration
        /// </summary>
        public static DeliveryFeeResult CalculateDeliveryFee(Brand brand, int distanceMeters)
        {
            // Check max distance limit
            if (brand.MaxDeliveryDistanceMeters.HasValue && distanceMeters > brand.MaxDeliveryDistanceMeters.Value)
            {
                return new DeliveryFeeResult
                {
                    IsDeliverable = false,
                    Reason = $"Distance exceeds maximum delivery range of {brand.MaxDeliveryDistanceMeters.Value} meters"
                };
            }

            // Calculate fee: BaseDeliveryFee + (distanceMeters * FeePerMeter)
            var fee = brand.BaseDeliveryFee + (distanceMeters * brand.FeePerMeter);

            // Apply minimum clamp
            if (brand.MinDeliveryFee.HasValue && fee < brand.MinDeliveryFee.Value)
            {
                fee = brand.MinDeliveryFee.Value;
            }

            // Apply maximum clamp
            if (brand.MaxDeliveryFee.HasValue && fee > brand.MaxDeliveryFee.Value)
            {
                fee = brand.MaxDeliveryFee.Value;
            }

            // Round to 2 decimal places
            fee = Math.Round(fee, 2);

            return new DeliveryFeeResult
            {
                Fee = fee,
                DistanceMeters = distanceMeters,
                IsDeliverable = true
            };
        }

        /// <summary>
        /// Full delivery calculation including validation
        /// </summary>
        public static DeliveryFeeResult CalculateDelivery(
            Brand brand, 
            decimal? brandLat, decimal? brandLng,
            decimal? customerLat, decimal? customerLng)
        {
            // Validate brand location
            if (!brandLat.HasValue || !brandLng.HasValue)
            {
                return new DeliveryFeeResult
                {
                    IsDeliverable = false,
                    Reason = "Store location not set"
                };
            }

            // Validate customer location
            if (!customerLat.HasValue || !customerLng.HasValue)
            {
                return new DeliveryFeeResult
                {
                    IsDeliverable = false,
                    Reason = "Address location is missing"
                };
            }

            // Calculate distance
            var distanceMeters = CalculateDistanceMeters(
                brandLat.Value, brandLng.Value,
                customerLat.Value, customerLng.Value);

            // Calculate fee
            return CalculateDeliveryFee(brand, distanceMeters);
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180;
    }

    public class DeliveryFeeResult
    {
        public decimal Fee { get; set; }
        public int DistanceMeters { get; set; }
        public bool IsDeliverable { get; set; }
        public string? Reason { get; set; }
    }
}
