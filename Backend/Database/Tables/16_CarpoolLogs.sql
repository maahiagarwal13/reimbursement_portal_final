-- ============================================================
-- Table: CarpoolLogs
-- Daily log entries extracted from the monthly Excel upload
-- Run order: 16
-- ============================================================

IF OBJECT_ID(N'[dbo].[CarpoolLogs]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CarpoolLogs]
    (
        [Id]                    INT             IDENTITY(1,1) NOT NULL,
        [RequestId]             NVARCHAR(20)    NOT NULL,
        [Date]                  DATE            NOT NULL,
        [IsCabpool]             BIT             NOT NULL,
        [VehicleIdentifier]     NVARCHAR(50)    NOT NULL,
        [OwnerEmpId]            NVARCHAR(20)    NULL,
        [OwnerStartTime]        TIME            NULL,
        [OwnerOfficeEntryTime]  TIME            NULL,
        [ParticipantEmpId]      NVARCHAR(20)    NOT NULL,
        [ParticipantPickupTime] TIME            NULL,
        [ParticipantOfficeEntryTime] TIME       NOT NULL,
        [PickupPoint]           NVARCHAR(200)   NULL,
        [TripType]              NVARCHAR(20)    NOT NULL,
        [CabBillFileId]         UNIQUEIDENTIFIER NULL,
        [DistanceKm]            DECIMAL(6,2)    NULL,
        [ComputedAmount]        DECIMAL(18,2)   NOT NULL,
        [IsEligible]            BIT             NOT NULL,
        [RejectionReason]       NVARCHAR(200)   NULL,

        CONSTRAINT [PK_CarpoolLogs] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_CarpoolLogs_Requests] FOREIGN KEY ([RequestId]) REFERENCES [dbo].[Requests]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CarpoolLogs_Owner] FOREIGN KEY ([OwnerEmpId]) REFERENCES [dbo].[Employees]([Id]),
        CONSTRAINT [FK_CarpoolLogs_Participant] FOREIGN KEY ([ParticipantEmpId]) REFERENCES [dbo].[Employees]([Id]),
        CONSTRAINT [FK_CarpoolLogs_CabBill] FOREIGN KEY ([CabBillFileId]) REFERENCES [dbo].[EmployeeFiles]([Id])
    );
END;
GO

PRINT '16 — CarpoolLogs table ready.';
GO
