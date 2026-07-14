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
