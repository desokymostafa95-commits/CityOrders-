using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class DeliveryNetworkSummaryDto
    {
        public int Offices { get; set; }
        public int ActiveOffices { get; set; }
        public int Agents { get; set; }
        public int AvailableAgents { get; set; }
        public int PlatformOpenAssignments { get; set; }
        public int AcceptedAssignments { get; set; }
    }

    public class DeliveryOfficeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int ManagerUserId { get; set; }
        public string ManagerName { get; set; } = string.Empty;
        public string ManagerEmail { get; set; } = string.Empty;
        public decimal DefaultCommissionPercent { get; set; }
        public int AgentCollectionCycleDays { get; set; }
        public List<string> AgentCollectionMethods { get; set; } = new();
        public bool IsActive { get; set; }
        public int AgentsCount { get; set; }
        public int AvailableAgentsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateDeliveryOfficeDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        [Range(0, 100)]
        public decimal DefaultCommissionPercent { get; set; }
        [Range(1, 60)]
        public int AgentCollectionCycleDays { get; set; } = 7;
        public List<string> AgentCollectionMethods { get; set; } = new() { "Cash", "Instapay", "COD" };
        [Required]
        public string ManagerName { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string ManagerEmail { get; set; } = string.Empty;
        [Required]
        [MinLength(6)]
        public string ManagerPassword { get; set; } = string.Empty;
    }

    public class UpdateDeliveryOfficeDto
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        [Range(0, 100)]
        public decimal? DefaultCommissionPercent { get; set; }
        [Range(1, 60)]
        public int? AgentCollectionCycleDays { get; set; }
        public List<string>? AgentCollectionMethods { get; set; }
        public bool? IsActive { get; set; }
    }

    public class DeliveryPlatformSettingsDto
    {
        public decimal IndependentPlatformCommissionPercent { get; set; }
        public int IndependentCollectionCycleDays { get; set; }
        public List<string> IndependentCollectionMethods { get; set; } = new();
    }

    public class UpdateDeliveryPlatformSettingsDto
    {
        [Range(0, 100)]
        public decimal IndependentPlatformCommissionPercent { get; set; }
        [Range(1, 60)]
        public int IndependentCollectionCycleDays { get; set; }
        public List<string> IndependentCollectionMethods { get; set; } = new() { "Cash", "Instapay", "COD" };
    }

    public class DeliveryAgentDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string AgentType { get; set; } = string.Empty;
        public int? DeliveryOfficeId { get; set; }
        public string? DeliveryOfficeName { get; set; }
        public int? MerchantUserId { get; set; }
        public string? MerchantName { get; set; }
        public string? Phone { get; set; }
        public string? VehicleType { get; set; }
        public bool IsActive { get; set; }
        public bool IsAvailable { get; set; }
        public decimal? CommissionPercent { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateDeliveryAgentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? VehicleType { get; set; }
        [Range(0, 100)]
        public decimal? CommissionPercent { get; set; }
    }

    public class UpdateDeliveryAgentDto
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? VehicleType { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsAvailable { get; set; }
        [Range(0, 100)]
        public decimal? CommissionPercent { get; set; }
    }

    public class DeliveryAssignmentDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? AgentName { get; set; }
        public string? DeliveryOfficeName { get; set; }
        public decimal DeliveryFeeSnapshot { get; set; }
        public decimal? PlatformCommissionAmount { get; set; }
        public decimal? AgentEarningAmount { get; set; }
        public decimal? OfficeCommissionAmount { get; set; }
        public string? CollectionRecipient { get; set; }
        public string CollectionStatus { get; set; } = string.Empty;
        public decimal? CollectionAmount { get; set; }
        public int? CollectionCycleDays { get; set; }
        public DateTime? CollectionDueAt { get; set; }
        public string? CollectionMethod { get; set; }
        public List<string> CollectionMethods { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
    }

    public class MarkDeliveryCollectionDto
    {
        public string? Method { get; set; }
    }

    public class UpdateDeliveryLocationDto
    {
        [Required]
        public decimal Lat { get; set; }
        [Required]
        public decimal Lng { get; set; }
    }

    public class DeliveryOrderActionDto
    {
        [Required]
        public string Action { get; set; } = string.Empty;
    }
}
