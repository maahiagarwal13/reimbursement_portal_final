using ReimbursementAPI.DTOs.Requests;
using ReimbursementAPI.DTOs.Dashboard;

namespace ReimbursementAPI.Interfaces;

public interface IRequestService
{
    // Queries
    Task<IEnumerable<RequestDto>> GetAllRequestsAsync();
    Task<IEnumerable<RequestDto>> GetRequestsForEmployeeAsync(string empId);
    Task<IEnumerable<RequestDto>> GetRequestsForFinanceAsync();
    Task<RequestDto?> GetRequestByIdAsync(string id);

    // Dashboard
    Task<DashboardStatsDto> GetEmployeeDashboardStatsAsync(string empId);
    Task<FinanceDashboardStatsDto> GetFinanceDashboardStatsAsync();

    // Create requests
    Task<RequestDto> CreateTravelRequestAsync(RequestDto req, TripRequestDto dto);
    Task<RequestDto> CreateInternetRequestAsync(RequestDto req, InternetBillRequestDto dto);
    Task<RequestDto> CreateCarpoolRequestAsync(RequestDto req, CarpoolGroupDto dto);
    Task<RequestDto> CreateCarpoolReimbursementAsync(RequestDto req, CarpoolRequestDto dto);
    Task<RequestDto> CreateRelocationRequestAsync(RequestDto req, RelocationRequestDto dto);

    // Update operations
    Task SubmitTripExtensionAsync(string id, TripExtensionDto dto);
    Task SubmitSettlementAsync(string id, SettlementDto dto);
    Task FinanceReviewTravelAsync(string id, string empId, string? preApprovalStatus, string? settlementStatus, string? extensionStatus, string? documentReviewStatus, string? stage, string? financeNote);
    Task FinanceReviewOtherAsync(string id, string empId, string status, string? financeNote);
}
