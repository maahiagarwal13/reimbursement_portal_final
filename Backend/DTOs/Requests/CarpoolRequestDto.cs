namespace ReimbursementAPI.DTOs.Requests;

public class CarpoolRequestDto
{
    public string RequestId { get; set; } = string.Empty;
    public string ReimbursementType { get; set; } = "carpool";
    public Guid? ExcelFileId { get; set; }
    public Guid? MapScreenshotId { get; set; }
    public Guid? FuelProofId { get; set; }
    public decimal? UserFuelRate { get; set; }
    public decimal TotalAmount { get; set; }
}
