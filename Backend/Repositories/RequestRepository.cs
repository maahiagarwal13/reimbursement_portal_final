using Dapper;
using System.Data;
using System.Text.Json;
using ReimbursementAPI.DTOs.Requests;

using ReimbursementAPI.Interfaces;

namespace ReimbursementAPI.Repositories;
public class RequestRepository : IRequestRepository
{
    private readonly IDbConnectionFactory _factory;

    public RequestRepository(IDbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<IEnumerable<RequestDto>> GetAllRequestsAsync()
    {
        using var conn = _factory.CreateConnection();
        using var multi = await conn.QueryMultipleAsync("sp_GetAllRequests", commandType: CommandType.StoredProcedure);
        return await MapRequestsAsync(multi);
    }

    public async Task<IEnumerable<RequestDto>> GetRequestsByEmpIdAsync(string empId)
    {
        using var conn = _factory.CreateConnection();
        using var multi = await conn.QueryMultipleAsync("sp_GetRequestsByEmpId", new { EmpId = empId }, commandType: CommandType.StoredProcedure);
        return await MapRequestsAsync(multi);
    }

    public async Task<IEnumerable<RequestDto>> GetRequestsForFinanceAsync()
    {
        using var conn = _factory.CreateConnection();
        using var multi = await conn.QueryMultipleAsync("sp_GetRequestsForFinance", commandType: CommandType.StoredProcedure);
        return await MapRequestsAsync(multi);
    }

    public async Task<RequestDto?> GetRequestByIdAsync(string id)
    {
        using var conn = _factory.CreateConnection();
        using var multi = await conn.QueryMultipleAsync("sp_GetRequestById", new { Id = id }, commandType: CommandType.StoredProcedure);
        var res = await MapRequestsAsync(multi);
        return res.FirstOrDefault();
    }

    private async Task<IEnumerable<RequestDto>> MapRequestsAsync(SqlMapper.GridReader multi)
    {
        var requests = (await multi.ReadAsync<RequestDto>()).ToList();
        var tripRequests = (await multi.ReadAsync<TripRequestDto>()).ToList();
        var preApprovals = (await multi.ReadAsync<PreApprovalDto>()).ToList();
        var settlements = (await multi.ReadAsync<SettlementDto>()).ToList();
        var tripExtensions = (await multi.ReadAsync<TripExtensionDto>()).ToList();
        var localConveyances = (await multi.ReadAsync<LocalConveyanceDto>()).ToList();
        
        var internetBills = (await multi.ReadAsync<InternetBillRequestDto>()).ToList();
        var internetPeriods = (await multi.ReadAsync<InternetBillPeriodDto>()).ToList();
        
        var carpoolGroups = (await multi.ReadAsync<CarpoolGroupDto>()).ToList();
        var carpoolMembers = (await multi.ReadAsync<CarpoolMemberDto>()).ToList();
        
        var relocRequests = (await multi.ReadAsync<RelocationRequestDto>()).ToList();
        var relocExpenses = (await multi.ReadAsync<RelocationExpenseDto>()).ToList();
        
        var carpoolReqs = (await multi.ReadAsync<CarpoolRequestDto>()).ToList();

        // 1. Build TripRequest hierarchy
        var conveyancesBySettlement = localConveyances.GroupBy(x => x.SettlementId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var s in settlements)
        {
            if (conveyancesBySettlement.TryGetValue(s.Id, out var lc)) s.LocalConveyances = lc;
        }

        var settlementsByTrip = settlements.ToDictionary(s => s.TripRequestId);
        var preApprovalsByTrip = preApprovals.ToDictionary(pa => pa.TripRequestId);
        var extensionsByTrip = tripExtensions.GroupBy(x => x.TripRequestId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var tr in tripRequests)
        {
            if (preApprovalsByTrip.TryGetValue(tr.Id, out var pa)) tr.PreApproval = pa;
            if (settlementsByTrip.TryGetValue(tr.Id, out var s)) tr.Settlement = s;
            if (extensionsByTrip.TryGetValue(tr.Id, out var ex)) tr.Extensions = ex;
        }

        // 2. Build Internet Bill hierarchy
        var periodsByBill = internetPeriods.GroupBy(x => x.InternetBillRequestId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var ib in internetBills)
        {
            if (periodsByBill.TryGetValue(ib.Id, out var p)) ib.Periods = p;
        }

        // 3. Build Carpool hierarchy
        var membersByGroup = carpoolMembers.GroupBy(x => x.CarpoolGroupId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var cg in carpoolGroups)
        {
            if (membersByGroup.TryGetValue(cg.Id, out var m)) cg.Members = m;
        }

        // 4. Build Relocation hierarchy
        var expensesByReloc = relocExpenses.GroupBy(x => x.RelocationRequestId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var rr in relocRequests)
        {
            if (expensesByReloc.TryGetValue(rr.Id, out var ex)) rr.Expenses = ex;
        }



        // 5. Attach to Master Requests
        var tripReqsByReqId = tripRequests.ToDictionary(tr => tr.RequestId);
        var internetBillsByReqId = internetBills.ToDictionary(ib => ib.RequestId);
        var carpoolGroupsByReqId = carpoolGroups.ToDictionary(cg => cg.RequestId);
        var relocRequestsByReqId = relocRequests.ToDictionary(rr => rr.RequestId);
        var carpoolReqsByReqId = carpoolReqs.ToDictionary(cr => cr.RequestId);

        foreach (var r in requests)
        {
            if (r.Type == "travel" && tripReqsByReqId.TryGetValue(r.Id, out var tr)) r.TripRequest = tr;
            else if (r.Type == "internet-bill" && internetBillsByReqId.TryGetValue(r.Id, out var ib)) r.InternetBillRequest = ib;
            else if (r.Type == "carpool") {
                if (carpoolGroupsByReqId.TryGetValue(r.Id, out var cg)) r.CarpoolGroup = cg;
                if (carpoolReqsByReqId.TryGetValue(r.Id, out var cr)) r.CarpoolRequest = cr;
            }
            else if (r.Type == "relocation" && relocRequestsByReqId.TryGetValue(r.Id, out var rr)) r.RelocationRequest = rr;
        }

        return requests;
    }

    public async Task CreateTravelRequestAsync(RequestDto req, TripRequestDto dto)
    {
        using var conn = _factory.CreateConnection();
        var pa = dto.PreApproval ?? new PreApprovalDto();
        
        await conn.ExecuteAsync("sp_CreateTravelRequest", new
        {
            Id = req.Id,
            EmpId = req.EmpId,
            Title = req.Title,
            
            Subtype = dto.Subtype,
            Destination = dto.Destination,
            State = dto.State,
            Region = dto.Region,
            Country = dto.Country,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Days = dto.Days,
            Purpose = dto.Purpose,
            TravelMode = dto.TravelMode,
            
            HasKnoxApproval = pa.HasKnoxApproval,
            KnoxApproval = pa.KnoxApproval,
            HasTravelInsurance = pa.HasTravelInsurance,
            TravelInsurance = pa.TravelInsurance,
            HasPassportCopy = pa.HasPassportCopy,
            PassportCopy = pa.PassportCopy,
            HasVisa = pa.HasVisa,
            Visa = pa.Visa,
            HasFlightTicket = pa.HasFlightTicket,
            FlightTicket = pa.FlightTicket
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task CreateInternetRequestAsync(RequestDto req, InternetBillRequestDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_CreateInternetRequest", new
        {
            Id = req.Id,
            EmpId = req.EmpId,
            Title = req.Title,
            Provider = dto.Provider,
            Frequency = dto.Frequency,
            TotalAmount = dto.TotalAmount,
            ClaimableAmount = dto.ClaimableAmount,
            ReimbursedTillMonth = dto.ReimbursedTillMonth,
            PeriodsJson = JsonSerializer.Serialize(dto.Periods ?? new List<InternetBillPeriodDto>())
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task CreateCarpoolRequestAsync(RequestDto req, CarpoolGroupDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_CreateCarpoolRequest", new
        {
            Id = req.Id,
            EmpId = req.EmpId,
            Title = req.Title,
            VehicleNumber = dto.VehicleNumber,
            TotalMembers = dto.TotalMembers,
            MonthlyAmount = dto.MonthlyAmount,
            ValidFrom = dto.ValidFrom,
            ValidTill = dto.ValidTill,
            TapInWindowMinutes = dto.TapInWindowMinutes,
            TapOutWindowMinutes = dto.TapOutWindowMinutes,
            MembersJson = JsonSerializer.Serialize(dto.Members ?? new List<CarpoolMemberDto>())
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task CreateCarpoolReimbursementAsync(RequestDto req, CarpoolRequestDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_CreateCarpoolReimbursement", new
        {
            Id = req.Id,
            EmpId = req.EmpId,
            Title = req.Title,
            ReimbursementType = dto.ReimbursementType,
            ExcelFileId = dto.ExcelFileId,
            MapScreenshotId = dto.MapScreenshotId,
            FuelProofId = dto.FuelProofId,
            UserFuelRate = dto.UserFuelRate,
            TotalAmount = dto.TotalAmount
        }, commandType: CommandType.StoredProcedure);
    }
    public async Task CreateRelocationRequestAsync(RequestDto req, RelocationRequestDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_CreateRelocationRequest", new
        {
            Id = req.Id,
            EmpId = req.EmpId,
            Title = req.Title,
            FromCity = dto.FromCity,
            ToCity = dto.ToCity,
            RelocDate = dto.RelocDate,
            TeamName = dto.TeamName,
            TotalAmount = dto.TotalAmount,
            ExpensesJson = JsonSerializer.Serialize(dto.Expenses ?? new List<RelocationExpenseDto>())
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task SubmitTripExtensionAsync(string requestId, TripExtensionDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_SubmitTripExtension", new
        {
            RequestId = requestId,
            RevisedEndDate = dto.RevisedEndDate,
            RevisedDays = dto.RevisedDays,
            Reason = dto.Reason,
            HasApprovalDocument = dto.HasApprovalDocument,
            ApprovalDocument = dto.ApprovalDocument
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task SubmitSettlementAsync(string requestId, SettlementDto dto)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_SubmitSettlement", new
        {
            RequestId = requestId,
            HotelName = dto.HotelName,
            HotelAmount = dto.HotelAmount,
            HasHotelBill = dto.HasHotelBill,
            HotelBill = dto.HotelBill,
            PerDiemDays = dto.PerDiemDays,
            PerDiemRate = dto.PerDiemRate,
            PerDiemAmount = dto.PerDiemAmount,
            Currency = dto.Currency,
            ExchangeRate = dto.ExchangeRate,
            TotalAmountForeign = dto.TotalAmountForeign,
            TotalAmountINR = dto.TotalAmountINR,
            HasBoardingPass = dto.HasBoardingPass,
            BoardingPass = dto.BoardingPass,
            HasPassportStamps = dto.HasPassportStamps,
            PassportStamps = dto.PassportStamps,
            HasTripReport = dto.HasTripReport,
            TripReport = dto.TripReport,
            HasForexStatement = dto.HasForexStatement,
            ForexStatement = dto.ForexStatement,
            WinterClothes = dto.WinterClothes,
            WinterClothesAmount = dto.WinterClothesAmount,
            LocalConveyancesJson = JsonSerializer.Serialize(dto.LocalConveyances ?? new List<LocalConveyanceDto>())
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task FinanceReviewTravelAsync(string id, string empId, string? preApprovalStatus, string? settlementStatus, string? extensionStatus, string? documentReviewStatus, string? stage, string? financeNote)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_FinanceReviewTravel", new
        {
            RequestId = id,
            FinanceEmpId = empId,
            PreApprovalStatus = preApprovalStatus,
            SettlementStatus = settlementStatus,
            ExtensionStatus = extensionStatus,
            DocumentReviewStatus = documentReviewStatus,
            Stage = stage,
            FinanceNote = financeNote
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task FinanceReviewOtherAsync(string id, string empId, string status, string? financeNote)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync("sp_FinanceReviewOther", new
        {
            RequestId = id,
            FinanceEmpId = empId,
            Status = status,
            FinanceNote = financeNote
        }, commandType: CommandType.StoredProcedure);
    }
}
