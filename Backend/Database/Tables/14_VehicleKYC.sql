-- ============================================================
-- Table: VehicleKYC
-- Stores vehicle registration details (insurance, RC, GMaps)
-- Run order: 14
-- ============================================================

IF OBJECT_ID(N'[dbo].[VehicleKYC]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[VehicleKYC]
    (
        [Id]                    INT             IDENTITY(1,1) NOT NULL,
        [EmpId]                 NVARCHAR(20)    NOT NULL,
        [VehicleNumber]         NVARCHAR(20)    NOT NULL,
        [InsuranceFileId]       UNIQUEIDENTIFIER NULL,
        [RCFileId]              UNIQUEIDENTIFIER NULL,
        [MapDistanceFileId]     UNIQUEIDENTIFIER NULL,
        [LockedDistanceKm]      DECIMAL(6,2)    NULL,
        [Status]                NVARCHAR(20)    NOT NULL CONSTRAINT [DF_VehicleKYC_Status] DEFAULT ('pending'), -- pending, approved, rejected
        [ApprovedBy]            NVARCHAR(20)    NULL,
        [ApprovedAt]            DATETIME2       NULL,
        [CreatedAt]             DATETIME2       NOT NULL CONSTRAINT [DF_VehicleKYC_CreatedAt] DEFAULT (GETUTCDATE()),

        CONSTRAINT [PK_VehicleKYC] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_VehicleKYC_Employees] FOREIGN KEY ([EmpId]) REFERENCES [dbo].[Employees]([Id]),
        CONSTRAINT [FK_VehicleKYC_ApprovedBy] FOREIGN KEY ([ApprovedBy]) REFERENCES [dbo].[Employees]([Id]),
        CONSTRAINT [FK_VehicleKYC_InsuranceFile] FOREIGN KEY ([InsuranceFileId]) REFERENCES [dbo].[EmployeeFiles]([Id]),
        CONSTRAINT [FK_VehicleKYC_RCFile] FOREIGN KEY ([RCFileId]) REFERENCES [dbo].[EmployeeFiles]([Id]),
        CONSTRAINT [FK_VehicleKYC_MapDistanceFile] FOREIGN KEY ([MapDistanceFileId]) REFERENCES [dbo].[EmployeeFiles]([Id]),
        CONSTRAINT [UQ_VehicleKYC_Emp_Vehicle] UNIQUE ([EmpId], [VehicleNumber])
    );
END;
GO

PRINT '14 — VehicleKYC table ready.';
GO
