using Microsoft.AspNetCore.Mvc;
using ReimbursementAPI.DTOs.Requests;
using ReimbursementAPI.Interfaces;
using System.Security.Claims;

namespace ReimbursementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KYCController : ControllerBase
{
    private readonly IVehicleKYCRepository _kycRepo;

    public KYCController(IVehicleKYCRepository kycRepo)
    {
        _kycRepo = kycRepo;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitKYC([FromBody] VehicleKYCDto dto)
    {
        var empId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(empId)) return Unauthorized();

        dto.EmpId = empId;
        await _kycRepo.CreateAsync(dto);
        return Ok(new { message = "Vehicle KYC submitted successfully" });
    }

    [HttpGet("{empId}")]
    public async Task<IActionResult> GetKYC(string empId)
    {
        var result = await _kycRepo.GetByEmpIdAsync(empId);
        return Ok(result);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        // Add admin check if needed
        var result = await _kycRepo.GetPendingKYCAsync();
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveKYCRequest req)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        await _kycRepo.ApproveAsync(id, adminId, req.LockedDistanceKm);
        return Ok(new { message = "KYC approved" });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        await _kycRepo.RejectAsync(id, adminId);
        return Ok(new { message = "KYC rejected" });
    }
}

public class ApproveKYCRequest
{
    public decimal LockedDistanceKm { get; set; }
}
