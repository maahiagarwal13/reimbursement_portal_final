-- Update Stored Procedures to include CarpoolRequests and CarpoolLogs

ALTER PROCEDURE [dbo].[sp_GetAllRequests]
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
    
    -- New additions
    SELECT cr.* FROM [dbo].[CarpoolRequests] cr INNER JOIN #AllReqs r ON cr.RequestId = r.Id;
    
    DROP TABLE #AllReqs;
END;
GO

ALTER PROCEDURE [dbo].[sp_GetRequestsByEmpId]
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
    
    -- New additions
    SELECT cr.* FROM [dbo].[CarpoolRequests] cr INNER JOIN #EmpReqs r ON cr.RequestId = r.Id;
    
    DROP TABLE #EmpReqs;
END;
GO

ALTER PROCEDURE [dbo].[sp_GetRequestById]
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
    
    -- New additions
    SELECT cr.* FROM [dbo].[CarpoolRequests] cr INNER JOIN #IdReq r ON cr.RequestId = r.Id;
    
    DROP TABLE #IdReq;
END;
GO

ALTER PROCEDURE [dbo].[sp_GetRequestsForFinance]
AS
BEGIN
    SET NOCOUNT ON;
    -- Finance only sees 'pending' requests (or you can show all if required, based on current logic)
    SELECT r.*, e.[Name] AS EmployeeName, e.[ClLevel] AS ClLevel INTO #FinReqs FROM [dbo].[Requests] r LEFT JOIN [dbo].[Employees] e ON r.EmpId = e.Id WHERE r.[Status] = 'pending' OR r.[Status] = 'approved' OR r.[Status] = 'rejected';
    SELECT * FROM #FinReqs ORDER BY [SubmittedAt] DESC;
    SELECT tr.* FROM [dbo].[TripRequests] tr INNER JOIN #FinReqs r ON tr.RequestId = r.Id;
    SELECT pa.* FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id INNER JOIN #FinReqs r ON tr.RequestId = r.Id;
    SELECT s.* FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #FinReqs r ON tr.RequestId = r.Id;
    SELECT te.* FROM [dbo].[TripExtensions] te INNER JOIN [dbo].[TripRequests] tr ON te.TripRequestId = tr.Id INNER JOIN #FinReqs r ON tr.RequestId = r.Id;
    SELECT lc.* FROM [dbo].[LocalConveyances] lc INNER JOIN [dbo].[Settlements] s ON lc.SettlementId = s.Id INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id INNER JOIN #FinReqs r ON tr.RequestId = r.Id;
    SELECT ib.* FROM [dbo].[InternetBillRequests] ib INNER JOIN #FinReqs r ON ib.RequestId = r.Id;
    SELECT ibp.* FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ib ON ibp.InternetBillRequestId = ib.Id INNER JOIN #FinReqs r ON ib.RequestId = r.Id;
    SELECT cg.* FROM [dbo].[CarpoolGroups] cg INNER JOIN #FinReqs r ON cg.RequestId = r.Id;
    SELECT cm.* FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id INNER JOIN #FinReqs r ON cg.RequestId = r.Id;
    SELECT rr.* FROM [dbo].[RelocationRequests] rr INNER JOIN #FinReqs r ON rr.RequestId = r.Id;
    SELECT re.* FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id INNER JOIN #FinReqs r ON rr.RequestId = r.Id;
    
    -- New additions
    SELECT cr.* FROM [dbo].[CarpoolRequests] cr INNER JOIN #FinReqs r ON cr.RequestId = r.Id;
    
    DROP TABLE #FinReqs;
END;
GO
