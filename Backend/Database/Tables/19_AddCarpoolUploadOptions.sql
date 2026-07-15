-- ============================================================
-- Script: 19_AddCarpoolUploadOptions.sql
-- Modifies CarpoolRequests table for new simplified flow.
-- ============================================================

IF COL_LENGTH('dbo.CarpoolRequests', 'ReimbursementType') IS NULL
BEGIN
    ALTER TABLE dbo.CarpoolRequests ADD ReimbursementType NVARCHAR(20) NOT NULL DEFAULT 'carpool';
END

IF COL_LENGTH('dbo.CarpoolRequests', 'ExcelFileId') IS NULL
BEGIN
    ALTER TABLE dbo.CarpoolRequests ADD ExcelFileId UNIQUEIDENTIFIER NULL;
END

IF COL_LENGTH('dbo.CarpoolRequests', 'MapScreenshotId') IS NULL
BEGIN
    ALTER TABLE dbo.CarpoolRequests ADD MapScreenshotId UNIQUEIDENTIFIER NULL;
END

IF COL_LENGTH('dbo.CarpoolRequests', 'FuelProofId') IS NULL
BEGIN
    ALTER TABLE dbo.CarpoolRequests ADD FuelProofId UNIQUEIDENTIFIER NULL;
END

IF COL_LENGTH('dbo.CarpoolRequests', 'UserFuelRate') IS NULL
BEGIN
    ALTER TABLE dbo.CarpoolRequests ADD UserFuelRate DECIMAL(10,2) NULL;
END
GO
