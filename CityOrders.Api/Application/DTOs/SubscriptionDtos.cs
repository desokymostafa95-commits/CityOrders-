using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CityOrders.Api.Application.DTOs
{
    // ==================== Admin DTOs ====================

    public class CreateSubscriptionPlanDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal PriceEgp { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int DurationDays { get; set; }

        [Range(0, int.MaxValue)]
        public int GraceDays { get; set; } = 7;

        [Required]
        [Range(0, 50)]
        public int MaxConcurrentOffers { get; set; } = 1;
    }

    public class UpdateSubscriptionPlanDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? PriceEgp { get; set; }

        [Range(1, int.MaxValue)]
        public int? DurationDays { get; set; }

        [Range(0, int.MaxValue)]
        public int? GraceDays { get; set; }

        [Range(0, 50)]
        public int? MaxConcurrentOffers { get; set; }
    }

    public class SubscriptionPlanDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceEgp { get; set; }
        public int DurationDays { get; set; }
        public int GraceDays { get; set; }
        public bool IsEnabled { get; set; }
        public int MaxConcurrentOffers { get; set; }
    }

    public class UpdateAppSettingsDto
    {
        [Range(0, 90)]
        public int FreeTrialDays { get; set; } = 14;

        [Range(0, 30)]
        public int DefaultGraceDays { get; set; } = 3;
    }


    public class SubscriptionPlanPublicDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceEgp { get; set; }
        public int DurationDays { get; set; }
        public int GraceDays { get; set; }
        public int MaxConcurrentOffers { get; set; }
    }

    // ==================== Payment Request DTOs ====================

    public class PaymentRequestListDto
    {
        public int Id { get; set; }
        public int MerchantUserId { get; set; }
        public string MerchantName { get; set; } = string.Empty;
        public string MerchantEmail { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public decimal PlanPriceEgp { get; set; }
        public string ProofFileUrl { get; set; } = string.Empty;
        public string PayerNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RejectPaymentRequestDto
    {
        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }

    public class PaymentRequestHistoryDto
    {
        public int Id { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public decimal PlanPriceEgp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    // ==================== Merchant Subscription DTOs ====================

    public class MerchantSubscriptionStatusDto
    {
        public bool HasSubscription { get; set; }
        public string State { get; set; } = "None"; // Active, Grace, Expired, None
        public string? PlanName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? GraceEndDate { get; set; }
        public int? DaysRemaining { get; set; }
        public bool HasPendingPayment { get; set; }
        public bool IsTrial { get; set; }
        public bool TrialAvailable { get; set; }
        public bool TrialActivated { get; set; }
        public bool IsFreeTrialEnabled { get; set; }
        public int FreeTrialDays { get; set; }
        public bool IsActive { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? RejectionReason { get; set; }
        public int MaxConcurrentOffers { get; set; }
        public int GraceDays { get; set; }
    }


    public class ApprovePaymentResultDto
    {
        public string Message { get; set; } = string.Empty;
        public DateTime SubscriptionEndDate { get; set; }
        public DateTime GraceEndDate { get; set; }
    }

    public class SubmitPaymentRequestDto
    {
        [Required]
        public int PlanId { get; set; }

        [Required]
        [MinLength(8)]
        [MaxLength(20)]
        public string PayerNumber { get; set; } = string.Empty;

        [Required]
        public IFormFile ProofFile { get; set; } = null!;
    }

    public class OfferLimitDto
    {
        public int MaxConcurrentOffers { get; set; }
        public int UsedConcurrentOffers { get; set; }
        public int Remaining { get; set; }
    }

    // ==================== Admin Monitoring & Action DTOs ====================

    public class MerchantSubscriptionMonitoringDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string BrandPhone { get; set; } = string.Empty;
        public string BrandAddress { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public decimal? Lat { get; set; }
        public decimal? Lng { get; set; }
        public string State { get; set; } = string.Empty;
        public DateTime EndDate { get; set; }
        public int DaysRemaining { get; set; }
        public DateTime? GraceEndDate { get; set; }
        public bool IsOnShift { get; set; }
        public DateTime? ShiftAutoCloseAt { get; set; }
        public bool IsActive { get; set; }
        public bool IsApproved { get; set; }
        public bool IsTemporarilyClosed { get; set; }
        public string? ApprovalRequestReason { get; set; }
        public int? MarketSectorId { get; set; }
        public string? MarketSectorName { get; set; }
        public string? MarketSectorSlug { get; set; }
        public List<string> MasterCategories { get; set; } = new();
        public List<int> MasterCategoryIds { get; set; } = new();
    }

    public class AdminSubscriptionDetailsDto : MerchantSubscriptionMonitoringDto
    {
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public bool IsTrial { get; set; }
    }

    public class ExtendSubscriptionDto
    {
        [Range(1, 365)]
        public int Days { get; set; }
        public string? Reason { get; set; }
    }

    public class RejectMerchantDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class AuditLogDto
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
    }
}
