namespace ReimbursementAPI.DTOs.Requests;

public class VehicleKYCDto
{
    public int Id { get; set; }
    public string EmpId { get; set; } = string.Empty;
    public string VehicleNumber { get; set; } = string.Empty;
    public Guid? InsuranceFileId { get; set; }
    public Guid? RCFileId { get; set; }
    public Guid? MapDistanceFileId { get; set; }
    public decimal? LockedDistanceKm { get; set; }
    public string Status { get; set; } = "pending";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
