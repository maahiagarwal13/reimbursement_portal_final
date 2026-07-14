
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ReimbursementDB')
BEGIN
    CREATE DATABASE ReimbursementDB;
END
GO
USE ReimbursementDB;
GO
-- ============================================================
-- Reimbursement Portal — Master Schema Runner
-- Run this file to create all tables in dependency order.
-- Target: Microsoft SQL Server 2019+
-- ============================================================

-- Run each table script in dependency order:
--   01 → Employees         (no deps)
--   02 → Requests          (→ Employees)
--   03 → TripRequests      (→ Requests)
--   04 → PreApprovals      (→ TripRequests, Employees)
--   05 → TripExtensions    (→ TripRequests, self-ref) + ALTER TripRequests FK
--   06 → Settlements       (→ TripRequests)
--   07 → LocalConveyances  (→ Settlements)
--   08 → InternetBillReqs  (→ Requests)
--   09 → InternetBillPers  (→ InternetBillRequests)
--   10 → CarpoolGroups     (→ Requests, Employees)
--   11 → CarpoolMembers    (→ CarpoolGroups, Employees)
--   12 → RelocationReqs    (→ Requests)
--   13 → RelocationExpenses(→ RelocationRequests)

-- NOTE: In SSMS, open each file via :r or run them manually
--       in the numbered order above.
--       If using sqlcmd, you can use:
--         sqlcmd -S localhost -d YourDB -i Tables\01_Employees.sql
--         sqlcmd -S localhost -d YourDB -i Tables\02_Requests.sql
--         ... etc.

PRINT '=== Run table scripts 01 through 13 in order ===';
PRINT '';
PRINT 'Table dependency graph:';
PRINT '';
PRINT '  Employees';
PRINT '    └── Requests';
PRINT '          ├── TripRequests';
PRINT '          │     ├── PreApprovals';
PRINT '          │     ├── TripExtensions (chained, self-ref)';
PRINT '          │     └── Settlements';
PRINT '          │           └── LocalConveyances (1:many)';
PRINT '          ├── InternetBillRequests';
PRINT '          │     └── InternetBillPeriods (1:many)';
PRINT '          ├── CarpoolGroups';
PRINT '          │     └── CarpoolMembers (1:many)';
PRINT '          └── RelocationRequests';
PRINT '                └── RelocationExpenses (1:many)';
PRINT '';
PRINT '=== Execute each file in Tables\ folder in order ===';
GO
-- ============================================================
-- Table: Employees
-- Stores all portal users (employees, finance, admin)
-- Run order: 1 (no dependencies)
-- ============================================================

IF OBJECT_ID(N'[dbo].[Employees]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Employees]
    (
        [Id]            NVARCHAR(20)    NOT NULL,
        [Name]          NVARCHAR(100)   NOT NULL,
        [ClLevel]       NVARCHAR(10)    NOT NULL,           -- CL1 / CL2 / CL3 / CL4
        [Department]    NVARCHAR(50)    NOT NULL,
        [Designation]   NVARCHAR(100)   NULL,
        [Email]         NVARCHAR(100)   NOT NULL,
        [Manager]       NVARCHAR(100)   NULL,
        [Username]      NVARCHAR(50)    NOT NULL,
        [PasswordHash]  NVARCHAR(255)   NOT NULL,
        [HasFinanceAccess] BIT          NOT NULL    CONSTRAINT [DF_Employees_Finance] DEFAULT (0),
        [HasAdminAccess] BIT            NOT NULL    CONSTRAINT [DF_Employees_Admin] DEFAULT (0),
        [Team]          NVARCHAR(50)    NULL,
        [Project]       NVARCHAR(100)   NULL,
        [CreatedAt]     DATETIME2       NOT NULL    CONSTRAINT [DF_Employees_CreatedAt] DEFAULT (GETUTCDATE()),

        CONSTRAINT [PK_Employees] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Employees_Email] UNIQUE ([Email]),
        CONSTRAINT [UQ_Employees_Username] UNIQUE ([Username])
    );
END;
GO

PRINT '01 — Employees table ready.';
GO
-- ============================================================
-- Table: Requests (Master)
-- One row per reimbursement request of any type.
-- Parent table — all subtypes FK back to this.
-- Run order: 2 (depends on: Employees)
-- ============================================================

IF OBJECT_ID(N'[dbo].[Requests]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Requests]
    (
        [Id]            NVARCHAR(20)    NOT NULL,               -- REQ-2026-XXXX
        [EmpId]         NVARCHAR(20)    NOT NULL,
        [Type]          NVARCHAR(30)    NOT NULL,               -- travel | internet-bill | carpool | relocation
        [Title]         NVARCHAR(200)   NOT NULL,
        [Status]        NVARCHAR(20)    NOT NULL    CONSTRAINT [DF_Requests_Status] DEFAULT ('pending'),
                                                                -- pending | approved | rejected
        [FinanceNote]   NVARCHAR(500)   NULL,
        [SubmittedAt]   DATETIME2       NOT NULL    CONSTRAINT [DF_Requests_SubmittedAt] DEFAULT (GETUTCDATE()),
        [UpdatedAt]     DATETIME2       NULL,

        CONSTRAINT [PK_Requests] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Requests_Employees] FOREIGN KEY ([EmpId])
            REFERENCES [dbo].[Employees]([Id]),
        CONSTRAINT [CK_Requests_Type] CHECK ([Type] IN (
            N'travel', N'internet-bill', N'carpool', N'relocation'
        ))
    );
END;
GO

-- Indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Requests_EmpId')
    CREATE NONCLUSTERED INDEX [IX_Requests_EmpId]
        ON [dbo].[Requests] ([EmpId]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Requests_Type')
    CREATE NONCLUSTERED INDEX [IX_Requests_Type]
        ON [dbo].[Requests] ([Type]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Requests_Status')
    CREATE NONCLUSTERED INDEX [IX_Requests_Status]
        ON [dbo].[Requests] ([Status]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Requests_SubmittedAt')
    CREATE NONCLUSTERED INDEX [IX_Requests_SubmittedAt]
        ON [dbo].[Requests] ([SubmittedAt] DESC);
GO

PRINT '02 — Requests master table ready.';
GO
/*
  File:    03_TripRequests.sql
  Object:  dbo.TripRequests
  Purpose: One row per business-travel request (domestic / international).
  Depends: dbo.Requests
*/

IF OBJECT_ID(N'dbo.TripRequests', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[TripRequests]
    (
        [Id]                  INT            IDENTITY(1,1)  NOT NULL,
        [RequestId]           NVARCHAR(20)   NOT NULL,
        [Subtype]             NVARCHAR(20)   NOT NULL,          -- domestic | international
        [Destination]         NVARCHAR(100)  NULL,              -- city name
        [State]               NVARCHAR(100)  NULL,              -- state (domestic)
        [Region]              NVARCHAR(100)  NULL,              -- Area A / B / C (domestic)
        [Country]             NVARCHAR(100)  NULL,              -- country (international)
        [StartDate]           DATE           NOT NULL,
        [EndDate]             DATE           NOT NULL,
        [Days]                INT            NOT NULL,
        [Purpose]             NVARCHAR(1000) NULL,
        [TravelMode]          NVARCHAR(50)   NULL,              -- Air / Train / Bus
        [Stage]               NVARCHAR(30)   NOT NULL  DEFAULT 'pre-approval',
            -- pre-approval | document-review | extension-pending | settlement-pending | settlement-approved
        [LatestExtensionId]   INT            NULL,              -- FK added after TripExtensions is created

        CONSTRAINT [PK_TripRequests]            PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_TripRequests_RequestId]  UNIQUE ([RequestId]),

        CONSTRAINT [FK_TripRequests_Requests]
            FOREIGN KEY ([RequestId])
            REFERENCES [dbo].[Requests] ([Id])
    );

    -- Indexes
    CREATE NONCLUSTERED INDEX [IX_TripRequests_RequestId]
        ON [dbo].[TripRequests] ([RequestId]);

    CREATE NONCLUSTERED INDEX [IX_TripRequests_Stage]
        ON [dbo].[TripRequests] ([Stage]);

    PRINT 'Created table [dbo].[TripRequests]';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[TripRequests] already exists — skipped.';
END
GO
/*
  File:    04_PreApprovals.sql
  Object:  dbo.PreApprovals
  Purpose: One row per trip pre-approval (corporate approval + document review).
  Depends: dbo.TripRequests, dbo.Employees
*/

IF OBJECT_ID(N'dbo.PreApprovals', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PreApprovals]
    (
        [Id]                    INT            IDENTITY(1,1)  NOT NULL,
        [TripRequestId]         INT            NOT NULL,
        [Status]                NVARCHAR(20)   NOT NULL  CONSTRAINT [DF_PreApprovals_Status] DEFAULT ('pending'),
        [HasKnoxApproval]       BIT            NOT NULL  CONSTRAINT [DF_PreApprovals_HasKnox] DEFAULT (0),
        [KnoxApproval]          NVARCHAR(200)  NULL,
        [HasTravelInsurance]    BIT            NOT NULL  CONSTRAINT [DF_PreApprovals_HasInsurance] DEFAULT (0),
        [TravelInsurance]       NVARCHAR(200)  NULL,
        [HasPassportCopy]       BIT            NOT NULL  CONSTRAINT [DF_PreApprovals_HasPassport] DEFAULT (0),
        [PassportCopy]          NVARCHAR(200)  NULL,
        [HasVisa]               BIT            NOT NULL  CONSTRAINT [DF_PreApprovals_HasVisa] DEFAULT (0),
        [Visa]                  NVARCHAR(200)  NULL,
        [HasFlightTicket]       BIT            NOT NULL  CONSTRAINT [DF_PreApprovals_HasFlight] DEFAULT (0),
        [FlightTicket]          NVARCHAR(200)  NULL,
        [DocumentReviewStatus]  NVARCHAR(20)   NULL,
        [ApprovedAt]            DATETIME2      NULL,
        [ReviewedBy]            NVARCHAR(20)   NULL,

        CONSTRAINT [PK_PreApprovals]                PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_PreApprovals_TripRequestId]  UNIQUE ([TripRequestId]),

        CONSTRAINT [FK_PreApprovals_TripRequests]
            FOREIGN KEY ([TripRequestId])
            REFERENCES [dbo].[TripRequests] ([Id]),

        CONSTRAINT [FK_PreApprovals_Employees_ReviewedBy]
            FOREIGN KEY ([ReviewedBy])
            REFERENCES [dbo].[Employees] ([Id])
    );

    -- Index
    CREATE NONCLUSTERED INDEX [IX_PreApprovals_TripRequestId]
        ON [dbo].[PreApprovals] ([TripRequestId]);

    PRINT 'Created table [dbo].[PreApprovals]';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[PreApprovals] already exists — skipped.';
END
GO
/*
  File:    05_TripExtensions.sql
  Object:  dbo.TripExtensions
  Purpose: Chained linked-list for trip extensions (self-referencing).
           Also adds deferred FK from TripRequests.LatestExtensionId → TripExtensions.Id.
  Depends: dbo.TripRequests
*/

-- ── 1. Create the TripExtensions table ──────────────────────────────────────

IF OBJECT_ID(N'dbo.TripExtensions', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[TripExtensions]
    (
        [Id]                    INT            IDENTITY(1,1)  NOT NULL,
        [TripRequestId]         INT            NOT NULL,
        [PreviousExtensionId]   INT            NULL,           -- self-ref → chain
        [RevisedEndDate]        DATE           NOT NULL,
        [RevisedDays]           INT            NOT NULL,
        [Reason]                NVARCHAR(500)  NULL,
        [HasApprovalDocument]   BIT            NOT NULL  DEFAULT (0),
        [ApprovalDocument]      NVARCHAR(200)  NULL,
        [Status]                NVARCHAR(20)   NOT NULL  DEFAULT 'pending',
            -- pending | approved | rejected
        [RequestedAt]           DATETIME2      NOT NULL  DEFAULT GETUTCDATE(),
        [ReviewedAt]            DATETIME2      NULL,

        CONSTRAINT [PK_TripExtensions]  PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [FK_TripExtensions_TripRequests]
            FOREIGN KEY ([TripRequestId])
            REFERENCES [dbo].[TripRequests] ([Id]),

        CONSTRAINT [FK_TripExtensions_PreviousExtension]
            FOREIGN KEY ([PreviousExtensionId])
            REFERENCES [dbo].[TripExtensions] ([Id])
    );

    -- Indexes
    CREATE NONCLUSTERED INDEX [IX_TripExtensions_TripRequestId]
        ON [dbo].[TripExtensions] ([TripRequestId]);

    CREATE NONCLUSTERED INDEX [IX_TripExtensions_Status]
        ON [dbo].[TripExtensions] ([Status]);

    PRINT 'Created table [dbo].[TripExtensions]';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[TripExtensions] already exists — skipped.';
END
GO

-- ── 2. Add deferred FK: TripRequests.LatestExtensionId → TripExtensions.Id ──

IF NOT EXISTS (
    SELECT 1
    FROM   sys.foreign_keys
    WHERE  [name] = N'FK_TripRequests_LatestExtension'
)
BEGIN
    ALTER TABLE [dbo].[TripRequests]
        ADD CONSTRAINT [FK_TripRequests_LatestExtension]
            FOREIGN KEY ([LatestExtensionId])
            REFERENCES [dbo].[TripExtensions] ([Id]);

    PRINT 'Added FK [FK_TripRequests_LatestExtension] on TripRequests.LatestExtensionId';
END
ELSE
BEGIN
    PRINT 'FK [FK_TripRequests_LatestExtension] already exists — skipped.';
END
GO
-- =============================================
-- Table:   [dbo].[Settlements]
-- Desc:    One row per trip settlement
-- Depends: [dbo].[TripRequests]
-- =============================================

IF OBJECT_ID(N'dbo.Settlements', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Settlements]
    (
        [Id]                  INT             IDENTITY(1,1)   NOT NULL,
        [TripRequestId]       INT             NOT NULL,
        [Status]              NVARCHAR(20)    NOT NULL        DEFAULT N'draft',   -- draft / submitted / approved / rejected
        [HotelName]           NVARCHAR(200)   NULL,
        [HotelAmount]         DECIMAL(18,2)   NULL,
        [HasHotelBill]        BIT             NOT NULL  CONSTRAINT [DF_Settlements_HasHotel] DEFAULT (0),
        [HotelBill]           NVARCHAR(200)   NULL,            -- uploaded file
        [PerDiemDays]         INT             NULL,
        [PerDiemRate]         DECIMAL(18,2)   NULL,
        [PerDiemAmount]       DECIMAL(18,2)   NULL,
        [Currency]            NVARCHAR(10)    NOT NULL        DEFAULT N'₹',
        [ExchangeRate]        DECIMAL(18,6)   NOT NULL        DEFAULT 1.0,
        [TotalAmountForeign]  DECIMAL(18,2)   NULL,
        [TotalAmountINR]      DECIMAL(18,2)   NULL,
        [HasBoardingPass]     BIT             NOT NULL  CONSTRAINT [DF_Settlements_HasBoarding] DEFAULT (0),
        [BoardingPass]        NVARCHAR(200)   NULL,            -- uploaded file
        [HasPassportStamps]   BIT             NOT NULL  CONSTRAINT [DF_Settlements_HasStamps] DEFAULT (0),
        [PassportStamps]      NVARCHAR(200)   NULL,            -- uploaded file (intl only)
        [HasTripReport]       BIT             NOT NULL  CONSTRAINT [DF_Settlements_HasReport] DEFAULT (0),
        [TripReport]          NVARCHAR(200)   NULL,            -- uploaded file
        [HasForexStatement]   BIT             NOT NULL  CONSTRAINT [DF_Settlements_HasForex] DEFAULT (0),
        [ForexStatement]      NVARCHAR(200)   NULL,            -- uploaded file (intl only)
        [WinterClothes]       BIT             NOT NULL        DEFAULT 0,
        [WinterClothesAmount] DECIMAL(18,2)   NULL,
        [SubmittedAt]         DATETIME2       NULL,
        [ReviewedAt]          DATETIME2       NULL,

        CONSTRAINT [PK_Settlements]                 PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Settlements_TripRequestId]   UNIQUE ([TripRequestId]),
        CONSTRAINT [FK_Settlements_TripRequests]     FOREIGN KEY ([TripRequestId])
                   REFERENCES [dbo].[TripRequests]([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Settlements_TripRequestId]
        ON [dbo].[Settlements] ([TripRequestId]);

    CREATE NONCLUSTERED INDEX [IX_Settlements_Status]
        ON [dbo].[Settlements] ([Status]);
END
GO

PRINT 'Table [dbo].[Settlements] ensured.';
GO
-- =============================================
-- Table:   [dbo].[LocalConveyances]
-- Desc:    One-to-many from Settlements — each cab trip, own vehicle trip, etc.
-- Depends: [dbo].[Settlements]
-- =============================================

IF OBJECT_ID(N'dbo.LocalConveyances', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[LocalConveyances]
    (
        [Id]              INT             IDENTITY(1,1)   NOT NULL,
        [SettlementId]    INT             NOT NULL,
        [ConveyanceType]  NVARCHAR(20)    NOT NULL,          -- cab / own-vehicle / public-transport
        [Route]           NVARCHAR(200)   NULL,              -- e.g. 'Residence → Airport (Departure)'
        [Amount]          DECIMAL(18,2)   NOT NULL,
        [Distance]        DECIMAL(10,2)   NULL,              -- km (for own vehicle)
        [HasBillDocument] BIT             NOT NULL        CONSTRAINT [DF_LocalConveyances_HasBill] DEFAULT (0),
        [BillDocument]    NVARCHAR(200)   NULL,              -- uploaded file

        CONSTRAINT [PK_LocalConveyances]              PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_LocalConveyances_Settlements]  FOREIGN KEY ([SettlementId])
                   REFERENCES [dbo].[Settlements]([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_LocalConveyances_SettlementId]
        ON [dbo].[LocalConveyances] ([SettlementId]);
END
GO

PRINT 'Table [dbo].[LocalConveyances] ensured.';
GO
-- ============================================================
-- Table:   [dbo].[InternetBillRequests]
-- Desc:    One row per internet-bill reimbursement request (1:1 with Requests).
-- Depends: [dbo].[Requests]
-- ============================================================

IF OBJECT_ID(N'dbo.InternetBillRequests', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[InternetBillRequests]
    (
        [Id]                    INT             IDENTITY(1,1)   NOT NULL,
        [RequestId]             NVARCHAR(20)                    NOT NULL,
        [Provider]              NVARCHAR(100)                   NOT NULL,
        [Frequency]             NVARCHAR(20)                    NOT NULL,   -- monthly / quarterly / half-yearly / yearly
        [TotalAmount]           DECIMAL(18,2)                   NULL,       -- sum of all period amounts
        [ClaimableAmount]       DECIMAL(18,2)                   NULL,       -- capped amount
        [ReimbursedTillMonth]   NVARCHAR(20)                    NULL,       -- e.g. 'March 2026'

        CONSTRAINT [PK_InternetBillRequests]            PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_InternetBillRequests_RequestId]  UNIQUE ([RequestId]),
        CONSTRAINT [FK_InternetBillRequests_Requests]   FOREIGN KEY ([RequestId])
            REFERENCES [dbo].[Requests] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_InternetBillRequests_RequestId]
        ON [dbo].[InternetBillRequests] ([RequestId]);

    PRINT 'Created table [dbo].[InternetBillRequests]';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[InternetBillRequests] already exists — skipped.';
END
GO
-- ============================================================
-- Table:   [dbo].[InternetBillPeriods]
-- Desc:    Individual billing periods for an internet-bill request (many:1 with InternetBillRequests).
-- Depends: [dbo].[InternetBillRequests]
-- ============================================================

IF OBJECT_ID(N'dbo.InternetBillPeriods', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[InternetBillPeriods]
    (
        [Id]                        INT             IDENTITY(1,1)   NOT NULL,
        [InternetBillRequestId]     INT                             NOT NULL,
        [PeriodLabel]               NVARCHAR(50)    NOT NULL,       -- 'Month 1', 'Q1', 'Year', etc.
        [Amount]                    DECIMAL(18,2)   NOT NULL,
        [HasBillDocument]           BIT             NOT NULL        CONSTRAINT [DF_InternetBillPeriods_HasBill] DEFAULT (0),
        [BillDocument]              NVARCHAR(200)   NULL,           -- uploaded file path / name

        CONSTRAINT [PK_InternetBillPeriods]                         PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_InternetBillPeriods_InternetBillRequests]     FOREIGN KEY ([InternetBillRequestId])
            REFERENCES [dbo].[InternetBillRequests] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_InternetBillPeriods_InternetBillRequestId]
        ON [dbo].[InternetBillPeriods] ([InternetBillRequestId]);

    PRINT 'Created table [dbo].[InternetBillPeriods]';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[InternetBillPeriods] already exists — skipped.';
END
GO
-- =============================================
-- Table:   [dbo].[CarpoolGroups]
-- Desc:    One row per carpool registration.
--          Links to a Request (1:1) and tracks
--          vehicle owner, metro proximity check,
--          AMS attendance verification, and
--          tap-in/out time windows.
-- Depends: [dbo].[Requests], [dbo].[Employees]
-- =============================================

IF OBJECT_ID(N'dbo.CarpoolGroups', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CarpoolGroups]
    (
        [Id]                    INT             IDENTITY(1,1)   NOT NULL,
        [RequestId]             NVARCHAR(20)    NOT NULL,
        [VehicleOwnerEmpId]     NVARCHAR(20)    NOT NULL,
        [VehicleNumber]         NVARCHAR(20)    NULL,
        [TotalMembers]          INT             NOT NULL,
        [MetroCheckPassed]      BIT             NOT NULL    CONSTRAINT [DF_CarpoolGroups_MetroCheckPassed]   DEFAULT (0),
        [IsActive]              BIT             NOT NULL    CONSTRAINT [DF_CarpoolGroups_IsActive]            DEFAULT (1),
        [MonthlyAmount]         DECIMAL(18,2)   NULL,
        [ValidFrom]             DATE            NULL,
        [ValidTill]             DATE            NULL,
        [AMSVerified]           BIT             NOT NULL    CONSTRAINT [DF_CarpoolGroups_AMSVerified]         DEFAULT (0),
        [AMSDaysPresent]        INT             NULL,
        [TapInWindowMinutes]    INT             NOT NULL    CONSTRAINT [DF_CarpoolGroups_TapInWindowMinutes]  DEFAULT (5),
        [TapOutWindowMinutes]   INT             NOT NULL    CONSTRAINT [DF_CarpoolGroups_TapOutWindowMinutes] DEFAULT (5),

        CONSTRAINT [PK_CarpoolGroups]                   PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [UQ_CarpoolGroups_RequestId]         UNIQUE ([RequestId]),

        CONSTRAINT [FK_CarpoolGroups_Requests]          FOREIGN KEY ([RequestId])
            REFERENCES [dbo].[Requests] ([Id]),

        CONSTRAINT [FK_CarpoolGroups_Employees_Owner]   FOREIGN KEY ([VehicleOwnerEmpId])
            REFERENCES [dbo].[Employees] ([Id]),

        CONSTRAINT [CK_CarpoolGroups_TotalMembers]      CHECK ([TotalMembers] >= 2)
    );

    CREATE NONCLUSTERED INDEX [IX_CarpoolGroups_RequestId]
        ON [dbo].[CarpoolGroups] ([RequestId]);

    CREATE NONCLUSTERED INDEX [IX_CarpoolGroups_VehicleOwnerEmpId]
        ON [dbo].[CarpoolGroups] ([VehicleOwnerEmpId]);
END;
GO

PRINT 'Table [dbo].[CarpoolGroups] ensured.';
GO
-- =============================================
-- Table:   [dbo].[CarpoolMembers]
-- Desc:    One row per member in a carpool group.
--          Stores pickup address, lat/lng for
--          metro proximity checks, and computed
--          nearest metro station with distance.
-- Depends: [dbo].[CarpoolGroups], [dbo].[Employees]
-- =============================================

IF OBJECT_ID(N'dbo.CarpoolMembers', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CarpoolMembers]
    (
        [Id]                    INT             IDENTITY(1,1)   NOT NULL,
        [CarpoolGroupId]        INT             NOT NULL,
        [EmpId]                 NVARCHAR(20)    NOT NULL,
        [EmployeeType]          NVARCHAR(20)    NOT NULL,
        [PickupAddress]         NVARCHAR(500)   NOT NULL,
        [Latitude]              DECIMAL(10,7)   NULL,
        [Longitude]             DECIMAL(10,7)   NULL,
        [NearestMetroStation]   NVARCHAR(200)   NULL,
        [MetroDistanceKm]       DECIMAL(5,2)    NULL,

        CONSTRAINT [PK_CarpoolMembers]                          PRIMARY KEY CLUSTERED ([Id] ASC),

        CONSTRAINT [UQ_CarpoolMembers_Group_Emp]                UNIQUE ([CarpoolGroupId], [EmpId]),

        CONSTRAINT [FK_CarpoolMembers_CarpoolGroups]            FOREIGN KEY ([CarpoolGroupId])
            REFERENCES [dbo].[CarpoolGroups] ([Id]),

        CONSTRAINT [FK_CarpoolMembers_Employees]                FOREIGN KEY ([EmpId])
            REFERENCES [dbo].[Employees] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_CarpoolMembers_CarpoolGroupId]
        ON [dbo].[CarpoolMembers] ([CarpoolGroupId]);

    CREATE NONCLUSTERED INDEX [IX_CarpoolMembers_EmpId]
        ON [dbo].[CarpoolMembers] ([EmpId]);
END;
GO

PRINT 'Table [dbo].[CarpoolMembers] ensured.';
GO
/*  ============================================================
    Table :  dbo.RelocationRequests
    Desc  :  One row per relocation request (1-to-1 with Requests).
    Deps  :  dbo.Requests
    ============================================================ */

IF OBJECT_ID(N'dbo.RelocationRequests', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[RelocationRequests]
    (
        [Id]            INT             IDENTITY(1,1)   NOT NULL,
        [RequestId]     NVARCHAR(20)                    NOT NULL,
        [FromCity]      NVARCHAR(100)                   NOT NULL,
        [ToCity]        NVARCHAR(100)                   NOT NULL,
        [RelocDate]     DATE                            NOT NULL,
        [TeamName]      NVARCHAR(100)                   NULL,
        [TotalAmount]   DECIMAL(18,2)                   NULL,

        CONSTRAINT [PK_RelocationRequests]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [UQ_RelocationRequests_RequestId]
            UNIQUE ([RequestId]),

        CONSTRAINT [FK_RelocationRequests_Requests]
            FOREIGN KEY ([RequestId])
            REFERENCES [dbo].[Requests] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_RelocationRequests_RequestId]
        ON [dbo].[RelocationRequests] ([RequestId]);

    PRINT 'Table [dbo].[RelocationRequests] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[RelocationRequests] already exists — skipped.';
END
GO
/*  ============================================================
    Table :  dbo.RelocationExpenses
    Desc  :  Expense line-items (many-to-one) for a RelocationRequest.
    Deps  :  dbo.RelocationRequests
    ============================================================ */

IF OBJECT_ID(N'dbo.RelocationExpenses', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[RelocationExpenses]
    (
        [Id]                    INT             IDENTITY(1,1)   NOT NULL,
        [RelocationRequestId]   INT                             NOT NULL,
        [Category]              NVARCHAR(50)                    NOT NULL,
        [Description]           NVARCHAR(500)                   NULL,
        [Amount]                DECIMAL(18,2)                   NOT NULL,
        [HasBillDocument]       BIT             NOT NULL        CONSTRAINT [DF_RelocationExpenses_HasBill] DEFAULT (0),
        [BillDocument]          NVARCHAR(200)                   NULL,

        CONSTRAINT [PK_RelocationExpenses]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [FK_RelocationExpenses_RelocationRequests]
            FOREIGN KEY ([RelocationRequestId])
            REFERENCES [dbo].[RelocationRequests] ([Id]),

        CONSTRAINT [CK_RelocationExpenses_Category]
            CHECK ([Category] IN (
                N'porter',
                N'brokerage',
                N'transport',
                N'packing',
                N'temporary-accommodation',
                N'other'
            ))
    );

    CREATE NONCLUSTERED INDEX [IX_RelocationExpenses_RelocationRequestId]
        ON [dbo].[RelocationExpenses] ([RelocationRequestId]);

    PRINT 'Table [dbo].[RelocationExpenses] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[RelocationExpenses] already exists — skipped.';
END
GO
CREATE TABLE EmployeeFiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EmpId VARCHAR(50) NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileType VARCHAR(50) NOT NULL, -- e.g., 'passport', 'boarding-pass', 'internet-bill', 'other'
    UploadedAt DATETIME DEFAULT GETUTCDATE()
);
GO

CREATE PROCEDURE sp_SaveEmployeeFile
    @EmpId VARCHAR(50),
    @FileName VARCHAR(255),
    @FilePath VARCHAR(500),
    @FileType VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO EmployeeFiles (EmpId, FileName, FilePath, FileType)
    VALUES (@EmpId, @FileName, @FilePath, @FileType);
END
GO

CREATE PROCEDURE sp_GetEmployeeFilesByEmpId
    @EmpId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id,
        EmpId,
        FileName,
        FilePath,
        FileType,
        UploadedAt
    FROM EmployeeFiles
    WHERE EmpId = @EmpId
    ORDER BY UploadedAt DESC;
END
GO

CREATE PROCEDURE sp_DeleteEmployeeFile
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM EmployeeFiles WHERE Id = @Id;
END
GO
-- ============================================================
-- Reimbursement Portal — Seed Data (Normalized Schema)
-- Target: Microsoft SQL Server 2019+
-- Idempotent: safe to run multiple times
-- Run AFTER all table scripts (01–13)
-- ============================================================


-- ============================================================
-- 1. SEED EMPLOYEES
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'EMP001')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'EMP001', N'Arjun Sharma', N'emp001', N'pass123', 0, 0, N'CL3', N'Technology', N'Software Engineer', N'arjun.sharma@company.com', N'Vikram Patel', N'AI', N'Orion');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'EMP002')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'EMP002', N'Priya Mehta', N'emp002', N'pass123', 0, 0, N'CL4', N'Operations', N'Associate', N'priya.mehta@company.com', N'Neha Gupta', N'AD', N'Mercury');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'EMP003')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'EMP003', N'Karan Singh', N'emp003', N'pass123', 0, 0, N'CL2', N'Sales', N'Senior Manager', N'karan.singh@company.com', N'Amit Joshi', N'QC', N'Atlas');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'FIN001')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'FIN001', N'Rahul Verma', N'finance01', N'pass123', 1, 0, N'CL2', N'Finance', N'Finance Analyst', N'rahul.verma@company.com', N'Priya Das', N'Finance', N'Portal');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'ADM001')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'ADM001', N'Sunita Rao', N'admin01', N'pass123', 1, 1, N'CL1', N'HR', N'HR Director', N'sunita.rao@company.com', NULL, N'HR', N'Corporate');

-- Intern for carpool testing
IF NOT EXISTS (SELECT 1 FROM [dbo].[Employees] WHERE [Id] = N'INT001')
    INSERT INTO [dbo].[Employees]
        ([Id], [Name], [Username], [PasswordHash], [HasFinanceAccess], [HasAdminAccess], [ClLevel], [Department], [Designation], [Email], [Manager], [Team], [Project])
    VALUES
        (N'INT001', N'Rohan Kapoor', N'intern01', N'pass123', 0, 0, N'CL4', N'Technology', N'Intern', N'rohan.kapoor@company.com', N'Arjun Sharma', N'AI', N'Orion');

PRINT 'Employees seeded.';
GO


-- ============================================================
-- 2. SEED: Business Travel (Completed — approved settlement)
-- ============================================================

-- Master request
IF NOT EXISTS (SELECT 1 FROM [dbo].[Requests] WHERE [Id] = N'REQ-2024-0001')
    INSERT INTO [dbo].[Requests]
        ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt], [UpdatedAt])
    VALUES
        (N'REQ-2024-0001', N'EMP001', N'travel', N'Client meeting at Mumbai HQ', N'approved', '2024-03-10T10:00:00', '2024-03-20T14:30:00');

-- Trip details
IF NOT EXISTS (SELECT 1 FROM [dbo].[TripRequests] WHERE [RequestId] = N'REQ-2024-0001')
    INSERT INTO [dbo].[TripRequests]
        ([RequestId], [Subtype], [Destination], [State], [Region], [StartDate], [EndDate], [Days], [Purpose], [TravelMode], [Stage])
    VALUES
        (N'REQ-2024-0001', N'domestic', N'Mumbai', N'Maharashtra', N'Area A', '2024-03-15', '2024-03-18', 4, N'Client meeting at Mumbai HQ', N'Air', N'settlement-approved');

-- Pre-approval (approved)
IF NOT EXISTS (SELECT 1 FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id WHERE tr.RequestId = N'REQ-2024-0001')
BEGIN
    DECLARE @trip1Id INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = N'REQ-2024-0001');
    INSERT INTO [dbo].[PreApprovals]
        ([TripRequestId], [Status], [KnoxApproval], [TravelInsurance], [ApprovedAt], [ReviewedBy])
    VALUES
        (@trip1Id, N'approved', N'knox_approval.pdf', N'insurance_cert.pdf', '2024-03-12T10:00:00', N'FIN001');
END;

-- Settlement (approved)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Settlements] s INNER JOIN [dbo].[TripRequests] tr ON s.TripRequestId = tr.Id WHERE tr.RequestId = N'REQ-2024-0001')
BEGIN
    DECLARE @trip1IdS INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = N'REQ-2024-0001');
    INSERT INTO [dbo].[Settlements]
        ([TripRequestId], [Status], [HotelName], [HotelAmount], [PerDiemDays], [PerDiemRate], [PerDiemAmount], [TotalAmountINR], [BoardingPass], [TripReport], [SubmittedAt], [ReviewedAt])
    VALUES
        (@trip1IdS, N'approved', N'Grand Hyatt', 12000.00, 4, 1500.00, 6000.00, 22500.00, N'bp_mumbai.pdf', N'trip_report.pdf', '2024-03-19T10:00:00', '2024-03-20T14:30:00');
END;

PRINT 'Seed: Travel (completed) inserted.';
GO


-- ============================================================
-- 3. SEED: Business Travel (Pending pre-approval)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Requests] WHERE [Id] = N'REQ-2024-0005')
    INSERT INTO [dbo].[Requests]
        ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES
        (N'REQ-2024-0005', N'EMP001', N'travel', N'Quarterly review at Delhi office', N'pending', '2024-05-05T09:15:00');

IF NOT EXISTS (SELECT 1 FROM [dbo].[TripRequests] WHERE [RequestId] = N'REQ-2024-0005')
    INSERT INTO [dbo].[TripRequests]
        ([RequestId], [Subtype], [Destination], [State], [Region], [StartDate], [EndDate], [Days], [Purpose], [TravelMode], [Stage])
    VALUES
        (N'REQ-2024-0005', N'domestic', N'Delhi', N'Delhi', N'Area A', '2024-05-10', '2024-05-14', 5, N'Quarterly review at Delhi office', N'Air', N'pre-approval');

IF NOT EXISTS (SELECT 1 FROM [dbo].[PreApprovals] pa INNER JOIN [dbo].[TripRequests] tr ON pa.TripRequestId = tr.Id WHERE tr.RequestId = N'REQ-2024-0005')
BEGIN
    DECLARE @trip2Id INT = (SELECT [Id] FROM [dbo].[TripRequests] WHERE [RequestId] = N'REQ-2024-0005');
    INSERT INTO [dbo].[PreApprovals]
        ([TripRequestId], [Status], [KnoxApproval], [TravelInsurance])
    VALUES
        (@trip2Id, N'pending', N'knox_delhi.pdf', N'travel_insurance.pdf');
END;

PRINT 'Seed: Travel (pending) inserted.';
GO


-- ============================================================
-- 4. SEED: Internet Bill (Pending — monthly, 3 periods)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Requests] WHERE [Id] = N'REQ-2024-0006')
    INSERT INTO [dbo].[Requests]
        ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES
        (N'REQ-2024-0006', N'EMP001', N'internet-bill', N'Internet Bill - Q1 2024', N'pending', '2024-04-01T08:00:00');

IF NOT EXISTS (SELECT 1 FROM [dbo].[InternetBillRequests] WHERE [RequestId] = N'REQ-2024-0006')
    INSERT INTO [dbo].[InternetBillRequests]
        ([RequestId], [Provider], [Frequency], [TotalAmount], [ClaimableAmount], [ReimbursedTillMonth])
    VALUES
        (N'REQ-2024-0006', N'Airtel Broadband', N'monthly', 2850.00, 2850.00, NULL);

IF NOT EXISTS (SELECT 1 FROM [dbo].[InternetBillPeriods] ibp INNER JOIN [dbo].[InternetBillRequests] ibr ON ibp.InternetBillRequestId = ibr.Id WHERE ibr.RequestId = N'REQ-2024-0006')
BEGIN
    DECLARE @inet1Id INT = (SELECT [Id] FROM [dbo].[InternetBillRequests] WHERE [RequestId] = N'REQ-2024-0006');
    INSERT INTO [dbo].[InternetBillPeriods] ([InternetBillRequestId], [PeriodLabel], [Amount], [BillDocument]) VALUES
        (@inet1Id, N'Month 1 (Jan)', 950.00, N'airtel_jan.pdf'),
        (@inet1Id, N'Month 2 (Feb)', 950.00, N'airtel_feb.pdf'),
        (@inet1Id, N'Month 3 (Mar)', 950.00, N'airtel_mar.pdf');
END;

PRINT 'Seed: Internet bill inserted.';
GO


-- ============================================================
-- 5. SEED: Carpooling (Approved)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Requests] WHERE [Id] = N'REQ-2024-0007')
    INSERT INTO [dbo].[Requests]
        ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt], [UpdatedAt])
    VALUES
        (N'REQ-2024-0007', N'EMP002', N'carpool', N'Carpool - Feb 2024', N'approved', '2024-03-01T07:30:00', '2024-03-05T11:00:00');

IF NOT EXISTS (SELECT 1 FROM [dbo].[CarpoolGroups] WHERE [RequestId] = N'REQ-2024-0007')
    INSERT INTO [dbo].[CarpoolGroups]
        ([RequestId], [VehicleOwnerEmpId], [VehicleNumber], [TotalMembers], [MetroCheckPassed], [IsActive], [MonthlyAmount], [ValidFrom], [ValidTill], [AMSVerified], [AMSDaysPresent])
    VALUES
        (N'REQ-2024-0007', N'EMP002', N'MH12AB1234', 2, 1, 1, 750.00, '2024-02-01', '2024-02-29', 1, 18);

IF NOT EXISTS (SELECT 1 FROM [dbo].[CarpoolMembers] cm INNER JOIN [dbo].[CarpoolGroups] cg ON cm.CarpoolGroupId = cg.Id WHERE cg.RequestId = N'REQ-2024-0007')
BEGIN
    DECLARE @cp1Id INT = (SELECT [Id] FROM [dbo].[CarpoolGroups] WHERE [RequestId] = N'REQ-2024-0007');
    INSERT INTO [dbo].[CarpoolMembers] ([CarpoolGroupId], [EmpId], [EmployeeType], [PickupAddress], [Latitude], [Longitude]) VALUES
        (@cp1Id, N'EMP002', N'full-time', N'Plot 42, Kothrud, Pune 411038', 18.5074, 73.8077),
        (@cp1Id, N'INT001', N'intern',    N'Lane 5, Karve Nagar, Pune 411052', 18.4920, 73.8170);
END;

PRINT 'Seed: Carpooling inserted.';
GO


-- ============================================================
-- 6. SEED: Relocation (Pending)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Requests] WHERE [Id] = N'REQ-2024-0008')
    INSERT INTO [dbo].[Requests]
        ([Id], [EmpId], [Type], [Title], [Status], [SubmittedAt])
    VALUES
        (N'REQ-2024-0008', N'EMP003', N'relocation', N'Relocation Pune → Bengaluru', N'pending', '2024-05-15T12:00:00');

IF NOT EXISTS (SELECT 1 FROM [dbo].[RelocationRequests] WHERE [RequestId] = N'REQ-2024-0008')
    INSERT INTO [dbo].[RelocationRequests]
        ([RequestId], [FromCity], [ToCity], [RelocDate], [TeamName], [TotalAmount])
    VALUES
        (N'REQ-2024-0008', N'Pune', N'Bengaluru', '2024-06-01', N'QC', 45000.00);

IF NOT EXISTS (SELECT 1 FROM [dbo].[RelocationExpenses] re INNER JOIN [dbo].[RelocationRequests] rr ON re.RelocationRequestId = rr.Id WHERE rr.RequestId = N'REQ-2024-0008')
BEGIN
    DECLARE @reloc1Id INT = (SELECT [Id] FROM [dbo].[RelocationRequests] WHERE [RequestId] = N'REQ-2024-0008');
    INSERT INTO [dbo].[RelocationExpenses] ([RelocationRequestId], [Category], [Description], [Amount], [BillDocument]) VALUES
        (@reloc1Id, N'transport', N'Flight Pune to Bengaluru', 8500.00, N'flight_blr.pdf'),
        (@reloc1Id, N'porter',    N'Movers and packers',       12000.00, N'packers_receipt.pdf'),
        (@reloc1Id, N'brokerage', N'Flat broker fee (1 month)', 15000.00, N'broker_receipt.pdf'),
        (@reloc1Id, N'packing',   N'Packing materials',         3500.00, N'packing_bill.pdf'),
        (@reloc1Id, N'temporary-accommodation', N'Hotel for 3 nights', 6000.00, N'hotel_temp.pdf');
END;

PRINT 'Seed: Relocation inserted.';
GO


PRINT '=== All seed data inserted successfully. ===';
GO

-- ============================================================
-- Reimbursement Portal — Stored Procedures (Normalized)
-- Target: Microsoft SQL Server 2019+
-- ============================================================


-- ============================================================
-- AUTH PROCEDURES
-- ============================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_GetEmployeeByUsername]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_GetEmployeeById]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllRequests]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_GetRequestsByEmpId]
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
CREATE OR ALTER PROCEDURE [dbo].[sp_GetRequestById]
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
CREATE OR ALTER PROCEDURE [dbo].[sp_GetRequestsForFinance]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_GetEmployeeDashboardStats]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_GetFinanceDashboardStats]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_CreateInternetRequest]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_CreateCarpoolRequest]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_CreateRelocationRequest]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_SubmitSettlement]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_SubmitTripExtension]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_FinanceReviewTravel]
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

CREATE OR ALTER PROCEDURE [dbo].[sp_FinanceReviewOther]
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

