using ReimbursementAPI.DTOs.Auth;
using ReimbursementAPI.DTOs.Requests;
using ReimbursementAPI.DTOs.Dashboard;
using ReimbursementAPI.Repositories;
using AutoMapper;

using ReimbursementAPI.Interfaces;

namespace ReimbursementAPI.Services;
public class RequestService : IRequestService
{
    private readonly IRequestRepository _repo;

    public RequestService(IRequestRepository repo)
    {
        _repo = repo;
    }

    private static string GenerateId()
    {
        return $"REQ-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
    }

    // ── Queries ──────────────────────────────────────────────────

    public async Task<IEnumerable<RequestDto>> GetAllRequestsAsync()
    {
        return await _repo.GetAllRequestsAsync();
    }

    public async Task<IEnumerable<RequestDto>> GetRequestsForEmployeeAsync(string empId)
    {
        return await _repo.GetRequestsByEmpIdAsync(empId);
    }

    public async Task<IEnumerable<RequestDto>> GetRequestsForFinanceAsync()
    {
        return await _repo.GetRequestsForFinanceAsync();
    }

    public async Task<RequestDto?> GetRequestByIdAsync(string id)
    {
        return await _repo.GetRequestByIdAsync(id);
    }

    // ── Dashboard Stats ─────────────────────────────────────────

    public async Task<DashboardStatsDto> GetEmployeeDashboardStatsAsync(string empId)
    {
        var allRequests = await _repo.GetRequestsByEmpIdAsync(empId);
        var list = allRequests.ToList();

        int pending = 0;
        int approved = 0;
        decimal totalReimbursed = 0m;

        foreach (var r in list)
        {
            bool isFullyApproved = false;

            if (r.Type == "travel")
            {
                var pre = r.TripRequest?.PreApproval?.Status;
                var stl = r.TripRequest?.Settlement?.Status;
                var ext = r.TripRequest?.Extensions?.OrderByDescending(e => e.Id).FirstOrDefault()?.Status;
                
                if (stl == "approved") 
                { 
                    approved++; 
                    isFullyApproved = true; 
                }
                else if (stl == "submitted" || stl == "pending") pending++;
                else if (ext == "pending") pending++;
                else if (pre == "approved") approved++;
                else if (pre == "pending" || r.Status == "pending") pending++;
            }
            else
            {
                if (r.Status == "pending" || r.Status == "submitted") pending++;
                else if (r.Status == "approved") 
                { 
                    approved++; 
                    isFullyApproved = true; 
                }
            }

            if (isFullyApproved)
            {
                if (r.Type == "travel" && r.TripRequest?.Settlement != null)
                    totalReimbursed += r.TripRequest.Settlement.TotalAmountINR ?? 0;
                else if (r.Type == "internet-bill" && r.InternetBillRequest != null)
                    totalReimbursed += r.InternetBillRequest.TotalAmount ?? 0;
                else if (r.Type == "relocation" && r.RelocationRequest != null)
                    totalReimbursed += r.RelocationRequest.TotalAmount ?? 0;
                else if (r.Type == "carpooling" && r.CarpoolGroup != null)
                    totalReimbursed += r.CarpoolGroup.MonthlyAmount ?? 0;
            }
        }

        return new DashboardStatsDto
        {
            TotalRequests = list.Count,
            Pending = pending,
            Approved = approved,
            TotalReimbursed = totalReimbursed,
            RecentRequests = list.OrderByDescending(r => r.SubmittedAt).Take(5).Cast<object>().ToList()
        };
    }

    public async Task<FinanceDashboardStatsDto> GetFinanceDashboardStatsAsync()
    {
        var list = await _repo.GetAllRequestsAsync();
        
        var actionable = new List<RequestDto>();
        int pendingPreApproval = 0;
        int pendingSettlement = 0;
        int pendingOther = 0;
        int approvedThisMonth = 0;
        int totalRejected = 0;
        decimal totalSubmittedValue = 0;

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        foreach (var r in list)
        {
            bool isApproved = false;
            decimal amt = 0;

            if (r.Type == "travel" && r.TripRequest?.Settlement != null)
            {
                amt = r.TripRequest.Settlement.TotalAmountINR ?? 0;
                if (r.TripRequest.Settlement.Status == "approved") isApproved = true;
            }
            else if (r.Type == "internet-bill" && r.InternetBillRequest != null)
            {
                amt = r.InternetBillRequest.TotalAmount ?? 0;
                if (r.Status == "approved") isApproved = true;
            }
            else if (r.Type == "relocation" && r.RelocationRequest != null)
            {
                amt = r.RelocationRequest.TotalAmount ?? 0;
                if (r.Status == "approved") isApproved = true;
            }
            else if (r.Type == "carpooling" && r.CarpoolGroup != null)
            {
                amt = r.CarpoolGroup.MonthlyAmount ?? 0;
                if (r.Status == "approved") isApproved = true;
            }
            
            if (isApproved)
            {
                totalSubmittedValue += amt;
                if (r.UpdatedAt >= startOfMonth)
                    approvedThisMonth++;
            }
            
            if (r.Status == "rejected" || r.TripRequest?.Settlement?.Status == "rejected" || r.TripRequest?.PreApproval?.Status == "rejected")
                totalRejected++;

            bool isActionable = false;

            if (r.Type == "travel")
            {
                var trip = r.TripRequest;
                if (trip != null)
                {
                    bool isPre = trip.PreApproval?.Status == "pending" || trip.PreApproval?.DocumentReviewStatus == "pending" || (r.Status == "pending" && trip.PreApproval == null);
                    var activeExt = trip.Extensions?.OrderByDescending(e => e.Id).FirstOrDefault();
                    bool isExt = activeExt?.Status == "pending";
                    bool isSet = trip.Settlement?.Status == "submitted";

                    if (isPre || isExt)
                    {
                        pendingPreApproval++;
                        isActionable = true;
                    }
                    if (isSet)
                    {
                        pendingSettlement++;
                        isActionable = true;
                    }
                }
            }
            else
            {
                if (r.Status == "pending")
                {
                    pendingOther++;
                    isActionable = true;
                }
            }

            if (isActionable)
            {
                actionable.Add(r);
            }
        }

        return new FinanceDashboardStatsDto
        {
            PendingPreApproval = pendingPreApproval,
            PendingSettlement = pendingSettlement,
            PendingOther = pendingOther,
            ApprovedThisMonth = approvedThisMonth,
            TotalRejected = totalRejected,
            TotalSubmittedValue = totalSubmittedValue,
            ActionableRequests = actionable.OrderByDescending(r => r.SubmittedAt).Cast<object>().ToList()
        };
    }

    // ── Create Requests ─────────────────────────────────────────

    public async Task<RequestDto> CreateTravelRequestAsync(RequestDto req, TripRequestDto dto)
    {
        req.Id = GenerateId();
        await _repo.CreateTravelRequestAsync(req, dto);
        return await _repo.GetRequestByIdAsync(req.Id) ?? req;
    }

    public async Task<RequestDto> CreateInternetRequestAsync(RequestDto req, InternetBillRequestDto dto)
    {
        req.Id = GenerateId();
        await _repo.CreateInternetRequestAsync(req, dto);
        return await _repo.GetRequestByIdAsync(req.Id) ?? req;
    }

    public async Task<RequestDto> CreateCarpoolRequestAsync(RequestDto req, CarpoolGroupDto dto)
    {
        req.Id = GenerateId();
        await _repo.CreateCarpoolRequestAsync(req, dto);
        return await _repo.GetRequestByIdAsync(req.Id) ?? req;
    }

    public async Task<RequestDto> CreateCarpoolReimbursementAsync(RequestDto req, CarpoolRequestDto dto)
    {
        req.Id = GenerateId();
        await _repo.CreateCarpoolReimbursementAsync(req, dto);
        var created = await _repo.GetRequestByIdAsync(req.Id);
        return created ?? req;
    }

    public async Task<RequestDto> CreateRelocationRequestAsync(RequestDto req, RelocationRequestDto dto)
    {
        req.Id = GenerateId();
        await _repo.CreateRelocationRequestAsync(req, dto);
        return await _repo.GetRequestByIdAsync(req.Id) ?? req;
    }

    // ── Update Operations ───────────────────────────────────────

    public async Task SubmitTripExtensionAsync(string id, TripExtensionDto dto)
    {
        await _repo.SubmitTripExtensionAsync(id, dto);
    }

    public async Task SubmitSettlementAsync(string id, SettlementDto dto)
    {
        await _repo.SubmitSettlementAsync(id, dto);
    }

    public async Task FinanceReviewTravelAsync(string id, string empId, string? preApprovalStatus, string? settlementStatus, string? extensionStatus, string? documentReviewStatus, string? stage, string? financeNote)
    {
        await _repo.FinanceReviewTravelAsync(id, empId, preApprovalStatus, settlementStatus, extensionStatus, documentReviewStatus, stage, financeNote);
    }

    public async Task FinanceReviewOtherAsync(string id, string empId, string status, string? financeNote)
    {
        await _repo.FinanceReviewOtherAsync(id, empId, status, financeNote);
    }
}
