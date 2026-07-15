using ReimbursementAPI.DTOs.Requests;

namespace ReimbursementAPI.Interfaces;

public interface IRequestRepository
{
    Task<IEnumerable<RequestDto>> GetAllRequestsAsync();
    Task<IEnumerable<RequestDto>> GetRequestsByEmpIdAsync(string empId);
    Task<IEnumerable<RequestDto>> GetRequestsForFinanceAsync();
    Task<RequestDto?> GetRequestByIdAsync(string id);
    
    Task CreateTravelRequestAsync(RequestDto req, TripRequestDto dto);
    Task CreateInternetRequestAsync(RequestDto req, InternetBillRequestDto dto);
    Task CreateCarpoolRequestAsync(RequestDto req, CarpoolGroupDto dto);
    Task CreateCarpoolReimbursementAsync(RequestDto req, CarpoolRequestDto dto);
    Task CreateRelocationRequestAsync(RequestDto req, RelocationRequestDto dto);
    
    Task SubmitTripExtensionAsync(string requestId, TripExtensionDto dto);
    Task SubmitSettlementAsync(string requestId, SettlementDto dto);
    
    Task FinanceReviewTravelAsync(string id, string empId, string? preApprovalStatus, string? settlementStatus, string? extensionStatus, string? documentReviewStatus, string? stage, string? financeNote);
    Task FinanceReviewOtherAsync(string id, string empId, string status, string? financeNote);
}
