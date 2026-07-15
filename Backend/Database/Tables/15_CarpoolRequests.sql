-- ============================================================
-- Table: CarpoolRequests
-- Child table for carpool/cabpool requests capturing snapshotted rates
-- Run order: 15
-- ============================================================

IF OBJECT_ID(N'[dbo].[CarpoolRequests]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CarpoolRequests]
    (
        [RequestId]         NVARCHAR(20)    NOT NULL,
        [AppliedFuelRate]   DECIMAL(10,2)   NULL,
        [AppliedMileage]    DECIMAL(10,2)   NULL,
        [AppliedCapOneWay]  DECIMAL(10,2)   NULL,
        [AppliedCapBothWay] DECIMAL(10,2)   NULL,
        [TotalAmount]       DECIMAL(18,2)   NOT NULL,
        
        CONSTRAINT [PK_CarpoolRequests] PRIMARY KEY CLUSTERED ([RequestId]),
        CONSTRAINT [FK_CarpoolRequests_Requests] FOREIGN KEY ([RequestId]) REFERENCES [dbo].[Requests]([Id]) ON DELETE CASCADE
    );
END;
GO

PRINT '15 — CarpoolRequests table ready.';
GO
