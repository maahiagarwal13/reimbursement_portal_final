using System;
using System.Collections.Generic;

namespace ReimbursementAPI.DTOs.Requests;

// 1. Master Request DTO
public class RequestDto
{
    public string Id { get; set; } = string.Empty;
    public string EmpId { get; set; } = string.Empty;
    public string? EmployeeName { get; set; }
    public string? ClLevel { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? FinanceNote { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Nested properties based on Type
    public TripRequestDto? TripRequest { get; set; }
    public InternetBillRequestDto? InternetBillRequest { get; set; }
    public CarpoolGroupDto? CarpoolGroup { get; set; }
    public RelocationRequestDto? RelocationRequest { get; set; }
    public CarpoolRequestDto? CarpoolRequest { get; set; }
}

// 2. Trip Requests DTOs
public class TripRequestDto
{
    public int Id { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string Subtype { get; set; } = string.Empty;
    public string? Destination { get; set; }
    public string? State { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Days { get; set; }
    public string? Purpose { get; set; }
    public string? TravelMode { get; set; }
    public string Stage { get; set; } = "pre-approval";
    public int? LatestExtensionId { get; set; }

    public PreApprovalDto? PreApproval { get; set; }
    public SettlementDto? Settlement { get; set; }
    public List<TripExtensionDto>? Extensions { get; set; }
}

public class PreApprovalDto
{
    public int Id { get; set; }
    public int TripRequestId { get; set; }
    public string Status { get; set; } = "pending";
    public bool HasKnoxApproval { get; set; }
    public string? KnoxApproval { get; set; }
    public bool HasTravelInsurance { get; set; }
    public string? TravelInsurance { get; set; }
    public bool HasPassportCopy { get; set; }
    public string? PassportCopy { get; set; }
    public bool HasVisa { get; set; }
    public string? Visa { get; set; }
    public bool HasFlightTicket { get; set; }
    public string? FlightTicket { get; set; }
    public string? DocumentReviewStatus { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ReviewedBy { get; set; }
}

public class TripExtensionDto
{
    public int Id { get; set; }
    public int TripRequestId { get; set; }
    public int? PreviousExtensionId { get; set; }
    public DateTime? RevisedEndDate { get; set; }
    public int? RevisedDays { get; set; }
    public string? Reason { get; set; }
    public bool HasApprovalDocument { get; set; }
    public string? ApprovalDocument { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime RequestedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

public class SettlementDto
{
    public int Id { get; set; }
    public int TripRequestId { get; set; }
    public string Status { get; set; } = "draft";
    public string? HotelName { get; set; }
    public decimal? HotelAmount { get; set; }
    public bool HasHotelBill { get; set; }
    public string? HotelBill { get; set; }
    public int? PerDiemDays { get; set; }
    public decimal? PerDiemRate { get; set; }
    public decimal? PerDiemAmount { get; set; }
    public string Currency { get; set; } = "₹";
    public decimal ExchangeRate { get; set; } = 1.0m;
    public decimal? TotalAmountForeign { get; set; }
    public decimal? TotalAmountINR { get; set; }
    public bool HasBoardingPass { get; set; }
    public string? BoardingPass { get; set; }
    public bool HasPassportStamps { get; set; }
    public string? PassportStamps { get; set; }
    public bool HasTripReport { get; set; }
    public string? TripReport { get; set; }
    public bool HasForexStatement { get; set; }
    public string? ForexStatement { get; set; }
    public bool WinterClothes { get; set; }
    public decimal? WinterClothesAmount { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public List<LocalConveyanceDto>? LocalConveyances { get; set; }
}

public class LocalConveyanceDto
{
    public int Id { get; set; }
    public int SettlementId { get; set; }
    public string ConveyanceType { get; set; } = string.Empty;
    public string? Route { get; set; }
    public decimal Amount { get; set; }
    public decimal? Distance { get; set; }
    public bool HasBillDocument { get; set; }
    public string? BillDocument { get; set; }
}

// 3. Internet Bill DTOs
public class InternetBillRequestDto
{
    public int Id { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public decimal? TotalAmount { get; set; }
    public decimal? ClaimableAmount { get; set; }
    public string? ReimbursedTillMonth { get; set; }

    public List<InternetBillPeriodDto>? Periods { get; set; }
}

public class InternetBillPeriodDto
{
    public int Id { get; set; }
    public int InternetBillRequestId { get; set; }
    public string PeriodLabel { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool HasBillDocument { get; set; }
    public string? BillDocument { get; set; }
}

// 4. Carpool DTOs
public class CarpoolGroupDto
{
    public int Id { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string VehicleOwnerEmpId { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public int TotalMembers { get; set; }
    public bool MetroCheckPassed { get; set; }
    public bool IsActive { get; set; }
    public decimal? MonthlyAmount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTill { get; set; }
    public bool AMSVerified { get; set; }
    public int? AMSDaysPresent { get; set; }
    public int TapInWindowMinutes { get; set; }
    public int TapOutWindowMinutes { get; set; }

    public List<CarpoolMemberDto>? Members { get; set; }
}

public class CarpoolMemberDto
{
    public int Id { get; set; }
    public int CarpoolGroupId { get; set; }
    public string EmpId { get; set; } = string.Empty;
    public string EmployeeType { get; set; } = string.Empty;
    public string PickupAddress { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? NearestMetroStation { get; set; }
    public decimal? MetroDistanceKm { get; set; }
}

// 5. Relocation DTOs
public class RelocationRequestDto
{
    public int Id { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string FromCity { get; set; } = string.Empty;
    public string ToCity { get; set; } = string.Empty;
    public DateTime? RelocDate { get; set; }
    public string? TeamName { get; set; }
    public decimal? TotalAmount { get; set; }

    public List<RelocationExpenseDto>? Expenses { get; set; }
}

public class RelocationExpenseDto
{
    public int Id { get; set; }
    public int RelocationRequestId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public bool HasBillDocument { get; set; }
    public string? BillDocument { get; set; }
}
