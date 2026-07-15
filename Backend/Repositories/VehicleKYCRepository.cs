using Dapper;
using System.Data;
using ReimbursementAPI.DTOs.Requests;
using ReimbursementAPI.Interfaces;

namespace ReimbursementAPI.Repositories;

public class VehicleKYCRepository : IVehicleKYCRepository
{
    private readonly IDbConnectionFactory _factory;

    public VehicleKYCRepository(IDbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<VehicleKYCDto?> GetByEmpIdAndVehicleAsync(string empId, string vehicleNumber)
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<VehicleKYCDto>(
            "SELECT * FROM [dbo].[VehicleKYC] WHERE EmpId = @EmpId AND VehicleNumber = @VehicleNumber",
            new { EmpId = empId, VehicleNumber = vehicleNumber }
        );
    }

    public async Task<IEnumerable<VehicleKYCDto>> GetByEmpIdAsync(string empId)
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryAsync<VehicleKYCDto>(
            "SELECT * FROM [dbo].[VehicleKYC] WHERE EmpId = @EmpId",
            new { EmpId = empId }
        );
    }

    public async Task<IEnumerable<VehicleKYCDto>> GetPendingKYCAsync()
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryAsync<VehicleKYCDto>(
            "SELECT * FROM [dbo].[VehicleKYC] WHERE Status = 'pending'"
        );
    }

    public async Task CreateAsync(VehicleKYCDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(@"
            INSERT INTO [dbo].[VehicleKYC] (EmpId, VehicleNumber, InsuranceFileId, RCFileId, MapDistanceFileId, Status, CreatedAt)
            VALUES (@EmpId, @VehicleNumber, @InsuranceFileId, @RCFileId, @MapDistanceFileId, 'pending', GETUTCDATE())",
            dto
        );
    }

    public async Task ApproveAsync(int id, string approvedBy, decimal lockedDistanceKm)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(@"
            UPDATE [dbo].[VehicleKYC] 
            SET Status = 'approved', ApprovedBy = @ApprovedBy, ApprovedAt = GETUTCDATE(), LockedDistanceKm = @LockedDistanceKm
            WHERE Id = @Id",
            new { Id = id, ApprovedBy = approvedBy, LockedDistanceKm = lockedDistanceKm }
        );
    }

    public async Task RejectAsync(int id, string rejectedBy)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(@"
            UPDATE [dbo].[VehicleKYC] 
            SET Status = 'rejected', ApprovedBy = @RejectedBy, ApprovedAt = GETUTCDATE()
            WHERE Id = @Id",
            new { Id = id, RejectedBy = rejectedBy }
        );
    }
}
