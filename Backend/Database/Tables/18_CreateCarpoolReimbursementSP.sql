ALTER PROCEDURE [dbo].[sp_CreateCarpoolReimbursement]
    @Id NVARCHAR(20),
    @EmpId NVARCHAR(20),
    @Title NVARCHAR(200),
    @TotalAmount DECIMAL(18,2),
    @ReimbursementType NVARCHAR(20),
    @ExcelFileId UNIQUEIDENTIFIER = NULL,
    @MapScreenshotId UNIQUEIDENTIFIER = NULL,
    @FuelProofId UNIQUEIDENTIFIER = NULL,
    @UserFuelRate DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO [dbo].[Requests] ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
        VALUES (@Id, @EmpId, 'carpool', @Title, 'pending', GETUTCDATE());
        
        INSERT INTO [dbo].[CarpoolRequests] (
            [RequestId], 
            [TotalAmount], 
            [ReimbursementType], 
            [ExcelFileId], 
            [MapScreenshotId], 
            [FuelProofId], 
            [UserFuelRate]
        )
        VALUES (
            @Id, 
            @TotalAmount, 
            @ReimbursementType, 
            @ExcelFileId, 
            @MapScreenshotId, 
            @FuelProofId, 
            @UserFuelRate
        );
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
