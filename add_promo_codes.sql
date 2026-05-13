-- Create PromoCodes table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PromoCodes')
BEGIN
    CREATE TABLE PromoCodes (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BrandId INT NOT NULL,
        Code NVARCHAR(50) NOT NULL,
        DiscountType NVARCHAR(20) NOT NULL,
        DiscountValue DECIMAL(18,2) NOT NULL,
        MaxDiscountAmount DECIMAL(18,2) NULL,
        MinOrderAmount DECIMAL(18,2) NULL,
        UsageLimit INT NULL,
        UsageCount INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        StartsAt DATETIME2 NULL,
        ExpiresAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_PromoCodes_Brands FOREIGN KEY (BrandId) REFERENCES Brands(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IX_PromoCodes_BrandId_Code ON PromoCodes (BrandId, Code);
    PRINT 'PromoCodes table created.';
END
ELSE
    PRINT 'PromoCodes table already exists.';

-- Create PromoCodeUsages table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PromoCodeUsages')
BEGIN
    CREATE TABLE PromoCodeUsages (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        PromoCodeId INT NOT NULL,
        CustomerUserId INT NOT NULL,
        OrderId INT NOT NULL,
        DiscountApplied DECIMAL(18,2) NOT NULL,
        UsedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PromoCodeUsages_PromoCodes FOREIGN KEY (PromoCodeId) REFERENCES PromoCodes(Id),
        CONSTRAINT FK_PromoCodeUsages_Users FOREIGN KEY (CustomerUserId) REFERENCES Users(Id),
        CONSTRAINT FK_PromoCodeUsages_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id)
    );
    CREATE UNIQUE INDEX IX_PromoCodeUsages_PromoCodeId_CustomerUserId ON PromoCodeUsages (PromoCodeId, CustomerUserId);
    PRINT 'PromoCodeUsages table created.';
END
ELSE
    PRINT 'PromoCodeUsages table already exists.';

-- Add promo columns to Orders
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'DiscountAmount')
BEGIN
    ALTER TABLE Orders ADD DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT 'DiscountAmount column added to Orders.';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'PromoCodeId')
BEGIN
    ALTER TABLE Orders ADD PromoCodeId INT NULL;
    ALTER TABLE Orders ADD CONSTRAINT FK_Orders_PromoCodes FOREIGN KEY (PromoCodeId) REFERENCES PromoCodes(Id);
    PRINT 'PromoCodeId column added to Orders.';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'PromoCodeSnapshot')
BEGIN
    ALTER TABLE Orders ADD PromoCodeSnapshot NVARCHAR(50) NULL;
    PRINT 'PromoCodeSnapshot column added to Orders.';
END

-- Register in EF migrations history so dotnet-ef doesn't re-run
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260416000000_AddPromoCodes')
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20260416000000_AddPromoCodes', '10.0.0-preview');
    PRINT 'Migration registered in history.';
END
