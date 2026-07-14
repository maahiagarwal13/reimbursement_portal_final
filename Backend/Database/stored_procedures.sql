-- ============================================================
-- Reimbursement Portal — Stored Procedures (Normalized)
-- Target: Microsoft SQL Server 2019+
-- ============================================================


-- ============================================================
-- AUTH PROCEDURES
-- ============================================================

CREATE PROCEDURE [dbo].[sp_GetEmployeeByUsername]
    @Username       NVARCHAR(50),
    @PasswordHash   NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Name], [ClLevel], [Department], [Designation], [Email], [Manager], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [Team], [Project], [CreatedAt]
    FROM [dbo].[Employees]
    WHERE [Username] = @Username AND [PasswordHash] = @PasswordHash;
END;
GO

CREATE PROCEDURE [dbo].[sp_GetEmployeeById]
    @Id     NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Name], [ClLevel], [Department], [Designation], [Email], [Manager], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [Team], [Project], [CreatedAt]
    FROM [dbo].[Employees]
    WHERE [Id] = @Id;
END;
GO


-- ============================================================
-- REQUEST QUERY PROCEDURES
-- ============================================================

-- Base query to get core request fields. We will join based on Type if needed,
-- but typically the API does a multi-map query (Dapper QueryMultiple).

CREATE PROCEDURE [dbo].[sp_GetAllRequests]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.*, e.[Name] AS EmployeeName, e.[ClLevel] AS ClLevel INTO #AllReqs FROM [dbo].[Requests] r LEFT JOIN [dbo].[Employees] e ON r.EmpId = e.Id;
    SELECT * FROM #AllReqs ORDER BY [SubmittedAt] DESC;
    SELECT tr.* FROM [dbo].[TripRequests] tr INNER JOIN #AllReqs r ON tr.RequestId = r.Id;
    SELECT pa.* FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id INNER JOIN #AllReqs r ON tr.RequestId = r.Id;
    SELECT s.* FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #AllReqs r ON tr.RequestId = r.Id;
    SELECT te.* FROM [dbo].[TripExtensions] te INNER JOIN [dbo].[TripRequests] tr ON te.TripRequestId = tr.Id INNER JOIN #AllReqs r ON tr.RequestId = r.Id;
    SELECT lc.* FROM [dbo].[LocalConveyances] lc INNER JOIN [dbo].[Settlements] s ON lc.SettlementId = s.Id INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #AllReqs r ON tr.RequestId = r.Id;
    SELECT ib.* FROM [dbo].[InternetBillRequests] ib INNER JOIN #AllReqs r ON ib.RequestId = r.Id;
    SELECT ibp.* FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ib ON ibp.InternetBillRequestId = ib.Id INNER JOIN #AllReqs r ON ib.RequestId = r.Id;
    SELECT cg.* FROM [dbo].[CarpoolGroups] cg INNER JOIN #AllReqs r ON cg.RequestId = r.Id;
    SELECT cm.* FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id INNER JOIN #AllReqs r ON cg.RequestId = r.Id;
    SELECT rr.* FROM [dbo].[RelocationRequests] rr INNER JOIN #AllReqs r ON rr.RequestId = r.Id;
    SELECT re.* FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id INNER JOIN #AllReqs r ON rr.RequestId = r.Id;
    DROP TABLE #AllReqs;
END;
GO

CREATE PROCEDURE [dbo].[sp_GetRequestsByEmpId]
    @EmpId  NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.*, e.[Name] AS EmployeeName, e.[ClLevel] AS ClLevel INTO #EmpReqs FROM [dbo].[Requests] r LEFT JOIN [dbo].[Employees] e ON r.EmpId = e.Id WHERE r.[EmpId] = @EmpId;
    SELECT * FROM #EmpReqs ORDER BY [SubmittedAt] DESC;
    SELECT tr.* FROM [dbo].[TripRequests] tr INNER JOIN #EmpReqs r ON tr.RequestId = r.Id;
    SELECT pa.* FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id INNER JOIN #EmpReqs r ON tr.RequestId = r.Id;
    SELECT s.* FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #EmpReqs r ON tr.RequestId = r.Id;
    SELECT te.* FROM [dbo].[TripExtensions] te INNER JOIN [dbo].[TripRequests] tr ON te.TripRequestId = tr.Id INNER JOIN #EmpReqs r ON tr.RequestId = r.Id;
    SELECT lc.* FROM [dbo].[LocalConveyances] lc INNER JOIN [dbo].[Settlements] s ON lc.SettlementId = s.Id INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #EmpReqs r ON tr.RequestId = r.Id;
    SELECT ib.* FROM [dbo].[InternetBillRequests] ib INNER JOIN #EmpReqs r ON ib.RequestId = r.Id;
    SELECT ibp.* FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ib ON ibp.InternetBillRequestId = ib.Id INNER JOIN #EmpReqs r ON ib.RequestId = r.Id;
    SELECT cg.* FROM [dbo].[CarpoolGroups] cg INNER JOIN #EmpReqs r ON cg.RequestId = r.Id;
    SELECT cm.* FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id INNER JOIN #EmpReqs r ON cg.RequestId = r.Id;
    SELECT rr.* FROM [dbo].[RelocationRequests] rr INNER JOIN #EmpReqs r ON rr.RequestId = r.Id;
    SELECT re.* FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id INNER JOIN #EmpReqs r ON rr.RequestId = r.Id;
    DROP TABLE #EmpReqs;
END;
GO

-- ------------------------------------------------------------
-- 5. sp_GetRequestById
-- Because we have 13 tables, we should return multiple result sets 
-- so Dapper can read them using QueryMultipleAsync.
-- ------------------------------------------------------------
CREATE PROCEDURE [dbo].[sp_GetRequestById]
    @Id NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.*, e.[Name] AS EmployeeName, e.[ClLevel] AS ClLevel INTO #IdReq FROM [dbo].[Requests] r LEFT JOIN [dbo].[Employees] e ON r.EmpId = e.Id WHERE r.[Id] = @Id;
    SELECT * FROM #IdReq ORDER BY [SubmittedAt] DESC;
    SELECT tr.* FROM [dbo].[TripRequests] tr INNER JOIN #IdReq r ON tr.RequestId = r.Id;
    SELECT pa.* FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id INNER JOIN #IdReq r ON tr.RequestId = r.Id;
    SELECT s.* FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #IdReq r ON tr.RequestId = r.Id;
    SELECT te.* FROM [dbo].[TripExtensions] te INNER JOIN [dbo].[TripRequests] tr ON te.TripRequestId = tr.Id INNER JOIN #IdReq r ON tr.RequestId = r.Id;
    SELECT lc.* FROM [dbo].[LocalConveyances] lc INNER JOIN [dbo].[Settlements] s ON lc.SettlementId = s.Id INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #IdReq r ON tr.RequestId = r.Id;
    SELECT ib.* FROM [dbo].[InternetBillRequests] ib INNER JOIN #IdReq r ON ib.RequestId = r.Id;
    SELECT ibp.* FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ib ON ibp.InternetBillRequestId = ib.Id INNER JOIN #IdReq r ON ib.RequestId = r.Id;
    SELECT cg.* FROM [dbo].[CarpoolGroups] cg INNER JOIN #IdReq r ON cg.RequestId = r.Id;
    SELECT cm.* FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id INNER JOIN #IdReq r ON cg.RequestId = r.Id;
    SELECT rr.* FROM [dbo].[RelocationRequests] rr INNER JOIN #IdReq r ON rr.RequestId = r.Id;
    SELECT re.* FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id INNER JOIN #IdReq r ON rr.RequestId = r.Id;
    DROP TABLE #IdReq;
END;
GO

-- ------------------------------------------------------------
-- 6. sp_GetRequestsForFinance
-- ------------------------------------------------------------
CREATE PROCEDURE [dbo].[sp_GetRequestsForFinance]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT r.*, e.[Name] AS EmployeeName, e.[ClLevel] AS ClLevel INTO #FinanceReqs 
    FROM [dbo].[Requests] r
    LEFT JOIN [dbo].[Employees] e ON r.[EmpId] = e.[Id]
    LEFT JOIN [dbo].[TripRequests] ptr ON r.[Id] = ptr.[RequestId]
    LEFT JOIN [dbo].[PreApprovals] ppa ON ptr.[Id] = ppa.[TripRequestId]
    LEFT JOIN [dbo].[Settlements] ps ON ptr.[Id] = ps.[TripRequestId]
    WHERE 
        (r.[Type] = 'business-travel' AND (ppa.[Status] = 'pending' OR ps.[Status] = 'submitted'))
        OR (r.[Type] <> 'business-travel' AND r.[Status] = 'pending');
        
    SELECT * FROM #FinanceReqs ORDER BY [SubmittedAt] ASC;
    SELECT tr.* FROM [dbo].[TripRequests] tr INNER JOIN #FinanceReqs r ON tr.RequestId = r.Id;
    SELECT pa.* FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id INNER JOIN #FinanceReqs r ON tr.RequestId = r.Id;
    SELECT s.* FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #FinanceReqs r ON tr.RequestId = r.Id;
    SELECT te.* FROM [dbo].[TripExtensions] te INNER JOIN [dbo].[TripRequests] tr ON te.TripRequestId = tr.Id INNER JOIN #FinanceReqs r ON tr.RequestId = r.Id;
    SELECT lc.* FROM [dbo].[LocalConveyances] lc INNER JOIN [dbo].[Settlements] s ON lc.SettlementId = s.Id INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #FinanceReqs r ON tr.RequestId = r.Id;
    SELECT ib.* FROM [dbo].[InternetBillRequests] ib INNER JOIN #FinanceReqs r ON ib.RequestId = r.Id;
    SELECT ibp.* FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ib ON ibp.InternetBillRequestId = ib.Id INNER JOIN #FinanceReqs r ON ib.RequestId = r.Id;
    SELECT cg.* FROM [dbo].[CarpoolGroups] cg INNER JOIN #FinanceReqs r ON cg.RequestId = r.Id;
    SELECT cm.* FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id INNER JOIN #FinanceReqs r ON cg.RequestId = r.Id;
    SELECT rr.* FROM [dbo].[RelocationRequests] rr INNER JOIN #FinanceReqs r ON rr.RequestId = r.Id;
    SELECT re.* FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id INNER JOIN #FinanceReqs r ON rr.RequestId = r.Id;
    DROP TABLE #FinanceReqs;
END;
GO


-- ============================================================
-- DASHBOARD STATISTICS PROCEDURES
-- ============================================================

CREATE PROCEDURE [dbo].[sp_GetEmployeeDashboardStats]
    @EmpId  NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS [TotalRequests],

        SUM(CASE 
            WHEN r.[Status] = 'pending' THEN 1 
            WHEN r.[Type] = 'business-travel' AND pa.[Status] = 'pending' THEN 1
            ELSE 0 
        END) AS [Pending],

        SUM(CASE 
            WHEN r.[Status] = 'approved' THEN 1 
            WHEN r.[Type] = 'business-travel' AND (pa.[Status] = 'approved' OR s.[Status] = 'approved') THEN 1
            ELSE 0 
        END) AS [Approved],

        ISNULL(SUM(CASE WHEN r.[Type] = 'business-travel' AND s.[Status] = 'approved' THEN s.[TotalAmountINR] ELSE 0 END), 0)
        + ISNULL(SUM(CASE WHEN r.[Type] = 'internet-bill' AND r.[Status] = 'approved' THEN ib.[ClaimableAmount] ELSE 0 END), 0)
        + ISNULL(SUM(CASE WHEN r.[Type] = 'carpooling' AND r.[Status] = 'approved' THEN cg.[MonthlyAmount] ELSE 0 END), 0)
        + ISNULL(SUM(CASE WHEN r.[Type] = 'relocation' AND r.[Status] = 'approved' THEN rr.[TotalAmount] ELSE 0 END), 0)
        AS [TotalReimbursed]

    FROM [dbo].[Requests] r
    LEFT JOIN [dbo].[TripRequests] tr ON r.[Id] = tr.[RequestId]
    LEFT JOIN [dbo].[PreApprovals] pa ON tr.[Id] = pa.[TripRequestId]
    LEFT JOIN [dbo].[Settlements] s ON tr.[Id] = s.[TripRequestId]
    LEFT JOIN [dbo].[InternetBillRequests] ib ON r.[Id] = ib.[RequestId]
    LEFT JOIN [dbo].[CarpoolGroups] cg ON r.[Id] = cg.[RequestId]
    LEFT JOIN [dbo].[RelocationRequests] rr ON r.[Id] = rr.[RequestId]
    WHERE r.[EmpId] = @EmpId;
END;
GO

CREATE PROCEDURE [dbo].[sp_GetFinanceDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SUM(CASE WHEN r.[Type] = 'business-travel' AND pa.[Status] = 'pending' THEN 1 ELSE 0 END) AS [PendingPreApproval],
        SUM(CASE WHEN r.[Type] = 'business-travel' AND s.[Status] = 'submitted' THEN 1 ELSE 0 END) AS [PendingSettlement],
        SUM(CASE WHEN r.[Type] <> 'business-travel' AND r.[Status] = 'pending' THEN 1 ELSE 0 END) AS [PendingOther],
        
        SUM(CASE WHEN (r.[Status] = 'approved' OR pa.[Status] = 'approved' OR s.[Status] = 'approved') 
            AND YEAR(r.[UpdatedAt]) = YEAR(GETUTCDATE()) AND MONTH(r.[UpdatedAt]) = MONTH(GETUTCDATE()) 
            THEN 1 ELSE 0 END) AS [ApprovedThisMonth],

        SUM(CASE WHEN r.[Status] = 'rejected' OR pa.[Status] = 'rejected' OR s.[Status] = 'rejected' THEN 1 ELSE 0 END) AS [TotalRejected],
        0 AS [TotalSubmittedValue] -- Simplify for now
    FROM [dbo].[Requests] r
    LEFT JOIN [dbo].[TripRequests] tr ON r.[Id] = tr.[RequestId]
    LEFT JOIN [dbo].[PreApprovals] pa ON tr.[Id] = pa.[TripRequestId]
    LEFT JOIN [dbo].[Settlements] s ON tr.[Id] = s.[TripRequestId]
END;
GO


-- ============================================================
-- CREATE REQUEST PROCEDURES
-- ============================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_CreateTravelRequest]
    @Id             NVARCHAR(20),
    @EmpId          NVARCHAR(20),
    @Title          NVARCHAR(200),
    
    @Subtype        NVARCHAR(20),
    @Destination    NVARCHAR(100),
    @State          NVARCHAR(100),
    @Region         NVARCHAR(100),
    @Country        NVARCHAR(100),
    @StartDate      DATE,
    @EndDate        DATE,
    @Days           INT,
    @Purpose        NVARCHAR(1000),
    @TravelMode     NVARCHAR(50),
    
    @HasKnoxApproval BIT,
    @KnoxApproval NVARCHAR(200),
    @HasTravelInsurance BIT,
    @TravelInsurance NVARCHAR(200),
    @HasPassportCopy BIT,
    @PassportCopy NVARCHAR(200),
    @HasVisa BIT,
    @Visa NVARCHAR(200),
    @HasFlightTicket BIT,
    @FlightTicket NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Insert Request
    INSERT INTO [dbo].[Requests] ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES (@Id, @EmpId, 'travel', @Title, 'pending', GETUTCDATE());

    -- Calculate days if NULL
    IF @Days IS NULL
    BEGIN
        SET @Days = DATEDIFF(DAY, @StartDate, @EndDate) + 1;
        IF @Days < 1 SET @Days = 1;
    END

    -- 2. Insert TripRequests
    INSERT INTO [dbo].[TripRequests] ([RequestId], [Subtype], [Destination], [State], [Region], [Country], [StartDate], [EndDate], [Days], [Purpose], [TravelMode], [Stage])
    VALUES (@Id, @Subtype, @Destination, @State, @Region, @Country, @StartDate, @EndDate, @Days, @Purpose, @TravelMode, 'pre-approval');

    DECLARE @TripReqId INT = SCOPE_IDENTITY();

    -- 3. Insert PreApprovals
    INSERT INTO [dbo].[PreApprovals] ([TripRequestId], [Status], [HasKnoxApproval], [KnoxApproval], [HasTravelInsurance], [TravelInsurance], [HasPassportCopy], [PassportCopy], [HasVisa], [Visa], [HasFlightTicket], [FlightTicket])
    VALUES (@TripReqId, 'pending', @HasKnoxApproval, @KnoxApproval, @HasTravelInsurance, @TravelInsurance, @HasPassportCopy, @PassportCopy, @HasVisa, @Visa, @HasFlightTicket, @FlightTicket);
END;
GO

-- Remaining SPs will require handling arrays/JSON for 1:N relations (LocalConveyances, etc.)
-- Since Dapper does not easily pass arrays to SPs, we will use JSON strings and OPENJSON in the SP.
GO
-- ============================================================
-- CREATE REQUEST PROCEDURES (continued)
-- ============================================================

CREATE PROCEDURE [dbo].[sp_CreateInternetRequest]
    @Id             NVARCHAR(20),
    @EmpId          NVARCHAR(20),
    @Title          NVARCHAR(200),
    @Provider       NVARCHAR(100),
    @Frequency      NVARCHAR(50),
    @TotalAmount    DECIMAL(18,2),
    @ClaimableAmount DECIMAL(18,2),
    @ReimbursedTillMonth NVARCHAR(50),
    @PeriodsJson    NVARCHAR(MAX) -- JSON array of periods
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Requests] ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES (@Id, @EmpId, 'internet-bill', @Title, 'pending', GETUTCDATE());

    INSERT INTO [dbo].[InternetBillRequests] ([RequestId], [Provider], [Frequency], [TotalAmount], [ClaimableAmount], [ReimbursedTillMonth])
    VALUES (@Id, @Provider, @Frequency, @TotalAmount, @ClaimableAmount, @ReimbursedTillMonth);

    DECLARE @ReqId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[InternetBillPeriods] ([InternetBillRequestId], [PeriodLabel], [Amount], [HasBillDocument], [BillDocument])
    SELECT @ReqId, [PeriodLabel], [Amount], [HasBillDocument], [BillDocument]
    FROM OPENJSON(@PeriodsJson)
    WITH (
        [PeriodLabel] NVARCHAR(50),
        [Amount] DECIMAL(18,2),
        [HasBillDocument] BIT,
        [BillDocument] NVARCHAR(200)
    );
END;
GO

CREATE PROCEDURE [dbo].[sp_CreateCarpoolRequest]
    @Id                 NVARCHAR(20),
    @EmpId              NVARCHAR(20),
    @Title              NVARCHAR(200),
    @VehicleNumber      NVARCHAR(20),
    @TotalMembers       INT,
    @MonthlyAmount      DECIMAL(18,2),
    @ValidFrom          DATE,
    @ValidTill          DATE,
    @TapInWindowMinutes INT,
    @TapOutWindowMinutes INT,
    @MembersJson        NVARCHAR(MAX) -- JSON array of members
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Requests] ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES (@Id, @EmpId, 'carpooling', @Title, 'pending', GETUTCDATE());

    INSERT INTO [dbo].[CarpoolGroups] ([RequestId], [VehicleOwnerEmpId], [VehicleNumber], [TotalMembers], [MonthlyAmount], [ValidFrom], [ValidTill], [TapInWindowMinutes], [TapOutWindowMinutes])
    VALUES (@Id, @EmpId, @VehicleNumber, @TotalMembers, @MonthlyAmount, @ValidFrom, @ValidTill, @TapInWindowMinutes, @TapOutWindowMinutes);

    DECLARE @GrpId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[CarpoolMembers] ([CarpoolGroupId], [EmpId], [EmployeeType], [PickupAddress], [Latitude], [Longitude], [NearestMetroStation], [MetroDistanceKm])
    SELECT @GrpId, [EmpId], [EmployeeType], [PickupAddress], [Latitude], [Longitude], [NearestMetroStation], [MetroDistanceKm]
    FROM OPENJSON(@MembersJson)
    WITH (
        [EmpId] NVARCHAR(20),
        [EmployeeType] NVARCHAR(50),
        [PickupAddress] NVARCHAR(500),
        [Latitude] DECIMAL(10,7),
        [Longitude] DECIMAL(10,7),
        [NearestMetroStation] NVARCHAR(100),
        [MetroDistanceKm] DECIMAL(10,2)
    );
END;
GO

CREATE PROCEDURE [dbo].[sp_CreateRelocationRequest]
    @Id             NVARCHAR(20),
    @EmpId          NVARCHAR(20),
    @Title          NVARCHAR(200),
    @FromCity       NVARCHAR(100),
    @ToCity         NVARCHAR(100),
    @RelocDate      DATE,
    @TeamName       NVARCHAR(100),
    @TotalAmount    DECIMAL(18,2),
    @ExpensesJson   NVARCHAR(MAX) -- JSON array of expenses
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Requests] ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES (@Id, @EmpId, 'relocation', @Title, 'pending', GETUTCDATE());

    INSERT INTO [dbo].[RelocationRequests] ([RequestId], [FromCity], [ToCity], [RelocDate], [TeamName], [TotalAmount])
    VALUES (@Id, @FromCity, @ToCity, @RelocDate, @TeamName, @TotalAmount);

    DECLARE @RelocId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[RelocationExpenses] ([RelocationRequestId], [Category], [Description], [Amount], [HasBillDocument], [BillDocument])
    SELECT @RelocId, [Category], [Description], [Amount], [HasBillDocument], [BillDocument]
    FROM OPENJSON(@ExpensesJson)
    WITH (
        [Category] NVARCHAR(50),
        [Description] NVARCHAR(500),
        [Amount] DECIMAL(18,2),
        [HasBillDocument] BIT,
        [BillDocument] NVARCHAR(200)
    );
END;
GO


-- ============================================================
-- SUBMIT SETTLEMENT / EXTENSION PROCEDURES
-- ============================================================

CREATE PROCEDURE [dbo].[sp_SubmitSettlement]
    @RequestId          NVARCHAR(20),
    @HotelName          NVARCHAR(200),
    @HotelAmount        DECIMAL(18,2),
    @HasHotelBill       BIT,
    @HotelBill          NVARCHAR(200),
    @PerDiemDays        INT,
    @PerDiemRate        DECIMAL(18,2),
    @PerDiemAmount      DECIMAL(18,2),
    @Currency           NVARCHAR(10),
    @ExchangeRate       DECIMAL(18,6),
    @TotalAmountForeign DECIMAL(18,2),
    @TotalAmountINR     DECIMAL(18,2),
    @HasBoardingPass    BIT,
    @BoardingPass       NVARCHAR(200),
    @HasPassportStamps  BIT,
    @PassportStamps     NVARCHAR(200),
    @HasTripReport      BIT,
    @TripReport         NVARCHAR(200),
    @HasForexStatement  BIT,
    @ForexStatement     NVARCHAR(200),
    @WinterClothes      BIT,
    @WinterClothesAmount DECIMAL(18,2),
    @LocalConveyancesJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TripReqId INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = @RequestId);

    -- Delete existing draft settlement if any
    DELETE FROM [dbo].[LocalConveyances] WHERE [SettlementId] IN (SELECT [Id] FROM [dbo].[Settlements] WHERE [TripRequestId] = @TripReqId);
    DELETE FROM [dbo].[Settlements] WHERE [TripRequestId] = @TripReqId;

    INSERT INTO [dbo].[Settlements] (
        [TripRequestId], [Status], [HotelName], [HotelAmount], [HasHotelBill], [HotelBill],
        [PerDiemDays], [PerDiemRate], [PerDiemAmount], [Currency], [ExchangeRate], [TotalAmountForeign], [TotalAmountINR],
        [HasBoardingPass], [BoardingPass], [HasPassportStamps], [PassportStamps], [HasTripReport], [TripReport],
        [HasForexStatement], [ForexStatement], [WinterClothes], [WinterClothesAmount], [SubmittedAt]
    ) VALUES (
        @TripReqId, 'submitted', @HotelName, @HotelAmount, @HasHotelBill, @HotelBill,
        @PerDiemDays, @PerDiemRate, @PerDiemAmount, @Currency, @ExchangeRate, @TotalAmountForeign, @TotalAmountINR,
        @HasBoardingPass, @BoardingPass, @HasPassportStamps, @PassportStamps, @HasTripReport, @TripReport,
        @HasForexStatement, @ForexStatement, @WinterClothes, @WinterClothesAmount, GETUTCDATE()
    );

    DECLARE @SettlementId INT = SCOPE_IDENTITY();

    INSERT INTO [dbo].[LocalConveyances] ([SettlementId], [ConveyanceType], [Route], [Amount], [Distance], [HasBillDocument], [BillDocument])
    SELECT @SettlementId, [ConveyanceType], [Route], [Amount], [Distance], [HasBillDocument], [BillDocument]
    FROM OPENJSON(@LocalConveyancesJson)
    WITH (
        [ConveyanceType] NVARCHAR(50),
        [Route] NVARCHAR(200),
        [Amount] DECIMAL(18,2),
        [Distance] DECIMAL(10,2),
        [HasBillDocument] BIT,
        [BillDocument] NVARCHAR(200)
    );
    
    -- Update stage
    UPDATE [dbo].[TripRequests] SET [Stage] = 'settlement-review' WHERE [Id] = @TripReqId;
END;
GO

CREATE PROCEDURE [dbo].[sp_SubmitTripExtension]
    @RequestId          NVARCHAR(20),
    @RevisedEndDate     DATE,
    @RevisedDays        INT,
    @Reason             NVARCHAR(500),
    @HasApprovalDocument BIT,
    @ApprovalDocument   NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TripReqId INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = @RequestId);
    DECLARE @PrevExtId INT = (SELECT [LatestExtensionId] FROM [dbo].[TripRequests] WHERE [Id] = @TripReqId);

    INSERT INTO [dbo].[TripExtensions] ([TripRequestId], [PreviousExtensionId], [RevisedEndDate], [RevisedDays], [Reason], [HasApprovalDocument], [ApprovalDocument], [Status])
    VALUES (@TripReqId, @PrevExtId, @RevisedEndDate, @RevisedDays, @Reason, @HasApprovalDocument, @ApprovalDocument, 'pending');

    DECLARE @NewExtId INT = SCOPE_IDENTITY();

    UPDATE [dbo].[TripRequests] SET [LatestExtensionId] = @NewExtId WHERE [Id] = @TripReqId;
END;
GO


-- ============================================================
-- FINANCE REVIEW PROCEDURES
-- ============================================================

CREATE PROCEDURE [dbo].[sp_FinanceReviewTravel]
    @RequestId              NVARCHAR(20),
    @FinanceEmpId           NVARCHAR(20),
    @PreApprovalStatus      NVARCHAR(20),
    @SettlementStatus       NVARCHAR(20),
    @ExtensionStatus        NVARCHAR(20),
    @DocumentReviewStatus   NVARCHAR(20),
    @Stage                  NVARCHAR(50),
    @FinanceNote            NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TripReqId INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = @RequestId);

    -- PreApproval
    IF @PreApprovalStatus IS NOT NULL
    BEGIN
        UPDATE [dbo].[PreApprovals] 
        SET [Status] = @PreApprovalStatus, [DocumentReviewStatus] = @DocumentReviewStatus, [ReviewedBy] = @FinanceEmpId, [ApprovedAt] = CASE WHEN @PreApprovalStatus = 'approved' THEN GETUTCDATE() ELSE NULL END
        WHERE [TripRequestId] = @TripReqId;
    END

    -- Settlement
    IF @SettlementStatus IS NOT NULL
    BEGIN
        UPDATE [dbo].[Settlements]
        SET [Status] = @SettlementStatus, [ReviewedAt] = GETUTCDATE()
        WHERE [TripRequestId] = @TripReqId;
    END

    -- Extension
    IF @ExtensionStatus IS NOT NULL
    BEGIN
        UPDATE [dbo].[TripExtensions]
        SET [Status] = @ExtensionStatus, [ReviewedAt] = GETUTCDATE()
        WHERE [TripRequestId] = @TripReqId AND [Status] = 'pending';

        IF @ExtensionStatus = 'approved'
        BEGIN
            DECLARE @RevDate DATETIME2, @RevDays INT;
            SELECT TOP 1 @RevDate = [RevisedEndDate], @RevDays = [RevisedDays]
            FROM [dbo].[TripExtensions]
            WHERE [TripRequestId] = @TripReqId AND [Status] = 'approved'
            ORDER BY [Id] DESC;

            IF @RevDate IS NOT NULL
            BEGIN
                UPDATE [dbo].[TripRequests]
                SET [EndDate] = @RevDate, [Days] = @RevDays
                WHERE [Id] = @TripReqId;
            END
        END
    END
    
    -- Master Request & TripRequest
    UPDATE [dbo].[Requests] SET [Status] = COALESCE(@SettlementStatus, @PreApprovalStatus, [Status]), [FinanceNote] = @FinanceNote, [UpdatedAt] = GETUTCDATE() WHERE [Id] = @RequestId;
    UPDATE [dbo].[TripRequests] SET [Stage] = @Stage WHERE [Id] = @TripReqId;

END;
GO

CREATE PROCEDURE [dbo].[sp_FinanceReviewOther]
    @RequestId      NVARCHAR(20),
    @FinanceEmpId   NVARCHAR(20),
    @Status         NVARCHAR(20),
    @FinanceNote    NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Requests]
    SET [Status] = @Status, [FinanceNote] = @FinanceNote, [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @RequestId;
END;
GO
