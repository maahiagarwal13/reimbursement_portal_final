using System;
using System.Collections.Generic;
using System.Linq;

namespace ReimbursementAPI.DTOs.Requests;

public class FrontendRequestDto
{
    public string id { get; set; } = string.Empty;
    public string ghrId { get; set; } = string.Empty;
    public string employeeName { get; set; } = string.Empty;
    public string type { get; set; } = string.Empty;
    public string subtype { get; set; } = string.Empty;
    public string stage { get; set; } = string.Empty;
    public string? preApprovalStatus { get; set; }
    public string? settlementStatus { get; set; }
    
    public object? dates { get; set; }
    public string? purpose { get; set; }
    public string? destination { get; set; }
    public object? documents { get; set; }
    public object? settlement { get; set; }
    
    public DateTime submittedAt { get; set; }
    public string? financeNote { get; set; }

    public static FrontendRequestDto FromRequestDto(RequestDto req)
    {
        var f = new FrontendRequestDto
        {
            id = req.Id,
            ghrId = req.EmpId,
            employeeName = req.EmployeeName ?? string.Empty,
            type = req.Type,
            submittedAt = req.SubmittedAt,
            financeNote = req.FinanceNote
        };

        if (req.Type == "travel" && req.TripRequest != null)
        {
            var tr = req.TripRequest;
            f.subtype = tr.Subtype;
            f.stage = tr.Stage;
            f.destination = tr.Country != null ? $"{tr.Destination}, {tr.Country}" : tr.Destination;
            f.purpose = tr.Purpose;
            f.dates = new { startDate = tr.StartDate?.ToString("yyyy-MM-dd"), endDate = tr.EndDate?.ToString("yyyy-MM-dd") };

            f.preApprovalStatus = tr.PreApproval?.Status ?? "pending";
            f.settlementStatus = tr.Settlement != null ? tr.Settlement.Status : null;

            f.documents = new
            {
                preApproval = tr.PreApproval != null ? new
                {
                    knoxApproval = tr.PreApproval.HasKnoxApproval ? new[] { new { name = tr.PreApproval.KnoxApproval ?? "knox.pdf" } } : null,
                    travelInsurance = tr.PreApproval.HasTravelInsurance ? new[] { new { name = tr.PreApproval.TravelInsurance ?? "insurance.pdf" } } : null,
                    visa = tr.PreApproval.HasVisa ? new[] { new { name = tr.PreApproval.Visa ?? "visa.pdf" } } : null,
                    passport = tr.PreApproval.HasPassportCopy ? new[] { new { name = tr.PreApproval.PassportCopy ?? "passport.pdf" } } : null,
                    flightTicket = tr.PreApproval.HasFlightTicket ? new[] { new { name = tr.PreApproval.FlightTicket ?? "flight.pdf" } } : null
                } : null,
                settlement = tr.Settlement != null ? new[]
                {
                    new { name = tr.Settlement.HotelBill ?? "hotel.pdf" },
                    new { name = tr.Settlement.BoardingPass ?? "boarding.pdf" }
                } : null
            };

            if (tr.Settlement != null)
            {
                var s = tr.Settlement;
                f.settlement = new
                {
                    hotelName = s.HotelName,
                    hotelActual = s.HotelAmount ?? 0,
                    flightActual = 0, // Not fully tracked in simplified DTO, fallback to 0
                    conveyanceActual = s.LocalConveyances?.Sum(c => c.Amount) ?? 0,
                    winterClothesActual = s.WinterClothesAmount ?? 0,
                    perDiemDays = s.PerDiemDays ?? tr.Days,
                    perDiemRate = s.PerDiemRate ?? 0,
                    perDiemTotal = s.PerDiemAmount ?? 0,
                    hotelCap = 0,
                    hotelReimbursable = s.HotelAmount ?? 0,
                    flightReimbursable = 0,
                    conveyanceReimbursable = s.LocalConveyances?.Sum(c => c.Amount) ?? 0,
                    winterClothesReimbursable = s.WinterClothesAmount ?? 0,
                    totalReimbursable = s.TotalAmountINR ?? 0,
                    currency = s.Currency
                };
            }
        }
        else if (req.Type == "internet-bill" && req.InternetBillRequest != null)
        {
            f.stage = "settlement";
            f.settlementStatus = req.Status;
            f.dates = new { startDate = req.SubmittedAt.ToString("yyyy-MM-dd"), endDate = req.SubmittedAt.ToString("yyyy-MM-dd") };
            var ir = req.InternetBillRequest;
            f.settlement = new
            {
                provider = ir.Provider,
                frequency = ir.Frequency,
                totalActual = ir.TotalAmount ?? 0,
                totalReimbursable = ir.ClaimableAmount ?? 0,
                periods = ir.Periods?.Select(p => new { label = p.PeriodLabel, amount = p.Amount }).ToList()
            };
        }
        else if (req.Type == "carpool" && req.CarpoolGroup != null)
        {
            f.stage = "settlement";
            f.settlementStatus = req.Status;
            f.dates = new { startDate = req.SubmittedAt.ToString("yyyy-MM-dd"), endDate = req.SubmittedAt.ToString("yyyy-MM-dd") };
            var cg = req.CarpoolGroup;
            f.settlement = new
            {
                vehicleNumber = cg.VehicleNumber,
                monthlyAmount = cg.MonthlyAmount,
                members = cg.Members?.Count ?? 0
            };
        }
        else if (req.Type == "carpool" && req.CarpoolRequest != null)
        {
            f.stage = "settlement";
            f.settlementStatus = req.Status;
            f.dates = new { startDate = req.SubmittedAt.ToString("yyyy-MM-dd"), endDate = req.SubmittedAt.ToString("yyyy-MM-dd") };
            var cr = req.CarpoolRequest;
            f.settlement = new
            {
                totalActual = cr.TotalAmount,
                totalReimbursable = cr.TotalAmount,
                reimbursementType = cr.ReimbursementType,
                excelFileId = cr.ExcelFileId,
                mapScreenshotId = cr.MapScreenshotId,
                fuelProofId = cr.FuelProofId,
                userFuelRate = cr.UserFuelRate
            };
        }
        else if (req.Type == "relocation" && req.RelocationRequest != null)
        {
            f.stage = "settlement";
            f.settlementStatus = req.Status;
            var rr = req.RelocationRequest;
            f.dates = new { startDate = rr.RelocDate?.ToString("yyyy-MM-dd"), endDate = rr.RelocDate?.ToString("yyyy-MM-dd") };
            f.destination = rr.ToCity;
            f.settlement = new
            {
                fromCity = rr.FromCity,
                toCity = rr.ToCity,
                totalActual = rr.Expenses?.Sum(e => e.Amount) ?? 0,
                totalReimbursable = rr.TotalAmount ?? 0,
                components = rr.Expenses?.Select(e => new { category = e.Category, actual = e.Amount, reimbursable = e.Amount }).ToList()
            };
        }
        else
        {
            f.stage = "settlement";
            f.settlementStatus = req.Status;
            f.dates = new { startDate = req.SubmittedAt.ToString("yyyy-MM-dd"), endDate = req.SubmittedAt.ToString("yyyy-MM-dd") };
        }

        return f;
    }
}
