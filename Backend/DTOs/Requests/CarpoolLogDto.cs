namespace ReimbursementAPI.DTOs.Requests;

public class CarpoolLogDto
{
    public int Id { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool IsCabpool { get; set; }
    public string VehicleIdentifier { get; set; } = string.Empty;
    public string? OwnerEmpId { get; set; }
    public TimeSpan? OwnerStartTime { get; set; }
    public TimeSpan? OwnerOfficeEntryTime { get; set; }
    public string ParticipantEmpId { get; set; } = string.Empty;
    public TimeSpan? ParticipantPickupTime { get; set; }
    public TimeSpan ParticipantOfficeEntryTime { get; set; }
    public string? PickupPoint { get; set; }
    public string TripType { get; set; } = string.Empty;
    public Guid? CabBillFileId { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal ComputedAmount { get; set; }
    public bool IsEligible { get; set; }
    public string? RejectionReason { get; set; }
}
