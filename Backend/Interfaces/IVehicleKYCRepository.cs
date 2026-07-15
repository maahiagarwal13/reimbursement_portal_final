using ReimbursementAPI.DTOs.Requests;

namespace ReimbursementAPI.Interfaces;

public interface IVehicleKYCRepository
{
    Task<VehicleKYCDto?> GetByEmpIdAndVehicleAsync(string empId, string vehicleNumber);
    Task<IEnumerable<VehicleKYCDto>> GetByEmpIdAsync(string empId);
    Task<IEnumerable<VehicleKYCDto>> GetPendingKYCAsync();
    Task CreateAsync(VehicleKYCDto dto);
    Task ApproveAsync(int id, string approvedBy, decimal lockedDistanceKm);
    Task RejectAsync(int id, string rejectedBy);
}
