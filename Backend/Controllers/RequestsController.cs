using Microsoft.AspNetCore.Mvc;
using ReimbursementAPI.DTOs.Requests;
using ReimbursementAPI.DTOs.Auth;
using ReimbursementAPI.Services;
using ReimbursementAPI.Interfaces;
using System.Threading.Tasks;

namespace ReimbursementAPI.Controllers;

[ApiController]
[Route("api/requests")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService _requestService;
    private readonly IAuthService _authService;

    public RequestsController(IRequestService requestService, IAuthService authService)
    {
        _requestService = requestService;
        _authService = authService;
    }

    // --- Employee Info for Finance Review ---
    [HttpGet("employee-info/{empId}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployeeInfo(string empId)
    {
        var emp = await _authService.GetEmployeeByIdAsync(empId);
        if (emp == null) return NotFound();
        return Ok(emp);
    }

    // --- Get APIs ---
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FrontendRequestDto>>> GetAllRequests()
    {
        var reqs = await _requestService.GetAllRequestsAsync();
        return Ok(reqs.Select(FrontendRequestDto.FromRequestDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FrontendRequestDto>> GetRequestById(string id)
    {
        var request = await _requestService.GetRequestByIdAsync(id);
        if (request == null) return NotFound();
        return Ok(FrontendRequestDto.FromRequestDto(request));
    }

    [HttpGet("employee/{empId}")]
    public async Task<ActionResult<IEnumerable<FrontendRequestDto>>> GetRequestsByEmployee(string empId)
    {
        var reqs = await _requestService.GetRequestsForEmployeeAsync(empId);
        return Ok(reqs.Select(FrontendRequestDto.FromRequestDto));
    }

    [HttpGet("finance")]
    public async Task<ActionResult<IEnumerable<FrontendRequestDto>>> GetFinanceActionableRequests()
    {
        var reqs = await _requestService.GetRequestsForFinanceAsync();
        return Ok(reqs.Select(FrontendRequestDto.FromRequestDto));
    }

    // --- Create APIs ---
    [HttpPost("travel/{empId}")]
    public async Task<ActionResult<FrontendRequestDto>> CreateTravelRequest(string empId, [FromBody] TripRequestDto dto)
    {
        var req = new RequestDto { EmpId = empId, Title = $"Travel to {dto.Destination}" }; 
        var created = await _requestService.CreateTravelRequestAsync(req, dto);
        return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, FrontendRequestDto.FromRequestDto(created));
    }

    [HttpPost("internet/{empId}")]
    public async Task<ActionResult<FrontendRequestDto>> CreateInternet(string empId, [FromBody] InternetBillRequestDto dto)
    {
        var req = new RequestDto { EmpId = empId, Title = $"Internet Bill" };
        var created = await _requestService.CreateInternetRequestAsync(req, dto);
        return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, FrontendRequestDto.FromRequestDto(created));
    }

    [HttpPost("carpool")]
    public async Task<ActionResult<FrontendRequestDto>> CreateCarpool([FromBody] CarpoolGroupDto dto)
    {
        var req = new RequestDto { EmpId = dto.VehicleOwnerEmpId, Title = $"Carpool Request" };
        var created = await _requestService.CreateCarpoolRequestAsync(req, dto);
        return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, FrontendRequestDto.FromRequestDto(created));
    }



    [HttpPost("carpool-reimbursement/submit")]
    public async Task<ActionResult<FrontendRequestDto>> SubmitCarpoolReimbursement([FromBody] CarpoolRequestDto dto)
    {
        var empId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(empId)) return Unauthorized();

        var req = new RequestDto { EmpId = empId, Title = $"Carpool Reimbursement" };
        var created = await _requestService.CreateCarpoolReimbursementAsync(req, dto);
        return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, FrontendRequestDto.FromRequestDto(created));
    }

    [HttpPost("relocation/{empId}")]
    public async Task<ActionResult<FrontendRequestDto>> CreateRelocation(string empId, [FromBody] RelocationRequestDto dto)
    {
        var req = new RequestDto { EmpId = empId, Title = $"Relocation {dto.FromCity} to {dto.ToCity}" };
        var created = await _requestService.CreateRelocationRequestAsync(req, dto);
        return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, FrontendRequestDto.FromRequestDto(created));
    }

    // --- Update APIs ---
    [HttpPost("{id}/extend-trip")]
    public async Task<IActionResult> SubmitTripExtension(string id, [FromBody] TripExtensionDto dto)
    {
        var existing = await _requestService.GetRequestByIdAsync(id);
        if (existing == null) return NotFound(new { message = "Request not found." });

        if (existing.Type != "travel" || existing.TripRequest?.PreApproval?.Status != "approved")
        {
            return BadRequest(new { message = "Trip extension can only be requested after pre-approval." });
        }

        await _requestService.SubmitTripExtensionAsync(id, dto);
        return Ok(new { message = "Trip extension submitted successfully.", id });
    }

    [HttpPost("{id}/settlement")]
    public async Task<IActionResult> SubmitSettlement(string id, [FromBody] SettlementDto dto)
    {
        var existing = await _requestService.GetRequestByIdAsync(id);
        if (existing == null) return NotFound(new { message = "Request not found." });

        await _requestService.SubmitSettlementAsync(id, dto);
        return Ok(new { message = "Settlement submitted successfully.", id });
    }

    [HttpPut("{id}/finance-review")]
    public async Task<IActionResult> FinanceReview(string id, [FromBody] FinanceReviewRequest req)
    {
        var existing = await _requestService.GetRequestByIdAsync(id);
        if (existing == null) return NotFound();

        if (existing.Type == "travel")
        {
            await _requestService.FinanceReviewTravelAsync(id, req.FinanceEmpId, req.PreApprovalStatus, req.SettlementStatus, req.ExtensionStatus, req.DocumentReviewStatus, req.Stage, req.FinanceNote);
        }
        else
        {
            // For simple requests, just use req.Status mapped to the general Status field
            await _requestService.FinanceReviewOtherAsync(id, req.FinanceEmpId, req.Status ?? "approved", req.FinanceNote);
        }
        
        return NoContent();
    }
}

public class FinanceReviewRequest
{
    public string FinanceEmpId { get; set; } = string.Empty;
    public string? Status { get; set; } // for simple non-travel requests
    public string? PreApprovalStatus { get; set; }
    public string? SettlementStatus { get; set; }
    public string? ExtensionStatus { get; set; }
    public string? DocumentReviewStatus { get; set; }
    public string? Stage { get; set; }
    public string? FinanceNote { get; set; }
}
