CREATE TABLE [AppSettings] (
    [Id] int NOT NULL IDENTITY,
    [IsFreeTrialEnabled] bit NOT NULL,
    [FreeTrialDays] int NOT NULL,
    [TrialGraceDays] int NOT NULL,
    [DefaultGraceDays] int NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AppSettings] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [Timestamp] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [Action] nvarchar(450) NOT NULL,
    [Target] nvarchar(max) NOT NULL,
    [Summary] nvarchar(max) NOT NULL,
    [AdminEmail] nvarchar(max) NOT NULL,
    [AdminName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Categories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Slug] nvarchar(120) NOT NULL,
    [Description] nvarchar(500) NULL,
    [IconKey] nvarchar(80) NULL,
    [ImageUrl] nvarchar(500) NULL,
    [SortOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [PaymentMethods] (
    [Id] int NOT NULL IDENTITY,
    [DisplayName] nvarchar(100) NOT NULL,
    [ReceiverName] nvarchar(100) NULL,
    [ReceiverNumber] nvarchar(50) NOT NULL,
    [Instructions] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [SortOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_PaymentMethods] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [SubscriptionPlans] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(450) NOT NULL,
    [PriceEgp] decimal(10,2) NOT NULL,
    [DurationDays] int NOT NULL,
    [GraceDays] int NOT NULL DEFAULT 7,
    [IsEnabled] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [CustomerProfiles] (
    [UserId] int NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK_CustomerProfiles] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_CustomerProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [DeliveryProfiles] (
    [UserId] int NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK_DeliveryProfiles] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_DeliveryProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MerchantProfiles] (
    [UserId] int NOT NULL,
    [IsApproved] bit NOT NULL DEFAULT CAST(0 AS bit),
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [IsOnShift] bit NOT NULL,
    [ShiftUpdatedAt] datetime2 NULL,
    [ShiftAutoCloseAt] datetime2 NULL,
    [ShiftAutoClosedBySystemAt] datetime2 NULL,
    [IsTemporarilyClosed] bit NOT NULL,
    [TemporaryCloseReason] nvarchar(max) NULL,
    [TemporaryCloseUntil] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_MerchantProfiles] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_MerchantProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MerchantSubscriptions] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [PlanId] int NULL,
    [IsTrial] bit NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [GraceEndDate] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_MerchantSubscriptions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MerchantSubscriptions_SubscriptionPlans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_MerchantSubscriptions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [SubscriptionPaymentRequests] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [PlanId] int NOT NULL,
    [ProofFilePath] nvarchar(500) NOT NULL,
    [PayerNumber] nvarchar(max) NOT NULL,
    [Status] nvarchar(20) NOT NULL DEFAULT N'Pending',
    [AdminNotes] nvarchar(1000) NULL,
    [ReviewedByUserId] int NULL,
    [ReviewedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_SubscriptionPaymentRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SubscriptionPaymentRequests_SubscriptionPlans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SubscriptionPaymentRequests_Users_ReviewedByUserId] FOREIGN KEY ([ReviewedByUserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_SubscriptionPaymentRequests_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [UserRoles] (
    [UserId] int NOT NULL,
    [RoleId] int NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [CustomerAddresses] (
    [Id] int NOT NULL IDENTITY,
    [CustomerUserId] int NOT NULL,
    [AddressLine] nvarchar(max) NOT NULL,
    [Notes] nvarchar(max) NULL,
    [IsDefault] bit NOT NULL DEFAULT CAST(0 AS bit),
    [UserId] int NULL,
    CONSTRAINT [PK_CustomerAddresses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CustomerAddresses_CustomerProfiles_CustomerUserId] FOREIGN KEY ([CustomerUserId]) REFERENCES [CustomerProfiles] ([UserId]) ON DELETE CASCADE,
    CONSTRAINT [FK_CustomerAddresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE TABLE [Brands] (
    [Id] int NOT NULL IDENTITY,
    [MerchantUserId] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Address] nvarchar(max) NULL,
    [Phone1] nvarchar(max) NULL,
    [Phone2] nvarchar(max) NULL,
    [Category] nvarchar(max) NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UserId] int NULL,
    CONSTRAINT [PK_Brands] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Brands_MerchantProfiles_MerchantUserId] FOREIGN KEY ([MerchantUserId]) REFERENCES [MerchantProfiles] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Brands_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO


CREATE TABLE [BrandCategories] (
    [Id] int NOT NULL IDENTITY,
    [BrandId] int NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Description] nvarchar(max) NULL,
    [SortOrder] int NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_BrandCategories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_BrandCategories_Brands_BrandId] FOREIGN KEY ([BrandId]) REFERENCES [Brands] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MerchantShifts] (
    [Id] int NOT NULL IDENTITY,
    [BrandId] int NOT NULL,
    [InvoiceNumber] nvarchar(450) NOT NULL,
    [StartAt] datetime2 NOT NULL,
    [EndAt] datetime2 NULL,
    [ClosedAt] datetime2 NULL,
    [Status] int NOT NULL,
    [DeliveredOrdersCount] int NOT NULL,
    [GrossSales] decimal(18,2) NOT NULL,
    [Currency] nvarchar(5) NOT NULL,
    [BrandNameSnapshot] nvarchar(max) NOT NULL,
    [BrandAddressSnapshot] nvarchar(max) NULL,
    [BrandPhoneSnapshot] nvarchar(max) NULL,
    [PdfUrl] nvarchar(max) NULL,
    CONSTRAINT [PK_MerchantShifts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MerchantShifts_Brands_BrandId] FOREIGN KEY ([BrandId]) REFERENCES [Brands] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Orders] (
    [Id] int NOT NULL IDENTITY,
    [OrderNumber] nvarchar(450) NOT NULL,
    [CustomerUserId] int NOT NULL,
    [BrandId] int NOT NULL,
    [DeliveryUserId] int NULL,
    [Status] int NOT NULL,
    [DeliveryAddressId] int NULL,
    [Notes] nvarchar(max) NULL,
    [Subtotal] decimal(18,2) NOT NULL,
    [DeliveryFee] decimal(18,2) NOT NULL DEFAULT 0.0,
    [Total] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    [UpdatedAt] datetime2 NULL,
    [DeliveredAt] datetime2 NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_Brands_BrandId] FOREIGN KEY ([BrandId]) REFERENCES [Brands] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Orders_CustomerAddresses_DeliveryAddressId] FOREIGN KEY ([DeliveryAddressId]) REFERENCES [CustomerAddresses] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Orders_Users_CustomerUserId] FOREIGN KEY ([CustomerUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Orders_Users_DeliveryUserId] FOREIGN KEY ([DeliveryUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Products] (
    [Id] int NOT NULL IDENTITY,
    [BrandId] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [Price] decimal(18,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CategoryId] int NULL,
    CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Products_BrandCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [BrandCategories] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Products_Brands_BrandId] FOREIGN KEY ([BrandId]) REFERENCES [Brands] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MerchantShiftOrders] (
    [Id] int NOT NULL IDENTITY,
    [MerchantShiftId] int NOT NULL,
    [OrderId] int NOT NULL,
    [OrderNumberSnapshot] nvarchar(max) NOT NULL,
    [TotalSnapshot] decimal(18,2) NOT NULL,
    [DeliveredAtSnapshot] datetime2 NOT NULL,
    CONSTRAINT [PK_MerchantShiftOrders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MerchantShiftOrders_MerchantShifts_MerchantShiftId] FOREIGN KEY ([MerchantShiftId]) REFERENCES [MerchantShifts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_MerchantShiftOrders_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [MerchantShiftLines] (
    [Id] int NOT NULL IDENTITY,
    [MerchantShiftId] int NOT NULL,
    [ProductId] int NULL,
    [ProductNameSnapshot] nvarchar(max) NOT NULL,
    [UnitPriceSnapshot] decimal(18,2) NOT NULL,
    [Quantity] int NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_MerchantShiftLines] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MerchantShiftLines_MerchantShifts_MerchantShiftId] FOREIGN KEY ([MerchantShiftId]) REFERENCES [MerchantShifts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_MerchantShiftLines_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id])
);
GO


CREATE TABLE [OrderItems] (
    [Id] int NOT NULL IDENTITY,
    [OrderId] int NOT NULL,
    [ProductId] int NOT NULL,
    [ProductNameSnapshot] nvarchar(max) NOT NULL,
    [UnitPriceSnapshot] decimal(18,2) NOT NULL,
    [Quantity] int NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [ProductPhotos] (
    [Id] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [Url] nvarchar(max) NOT NULL,
    [IsPrimary] bit NOT NULL DEFAULT CAST(0 AS bit),
    CONSTRAINT [PK_ProductPhotos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductPhotos_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);
GO


IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Name') AND [object_id] = OBJECT_ID(N'[Roles]'))
    SET IDENTITY_INSERT [Roles] ON;
INSERT INTO [Roles] ([Id], [Name])
VALUES (1, N'Customer'),
(2, N'Merchant'),
(3, N'Delivery'),
(4, N'Admin');
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Name') AND [object_id] = OBJECT_ID(N'[Roles]'))
    SET IDENTITY_INSERT [Roles] OFF;
GO


CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action]);
GO


CREATE INDEX [IX_AuditLogs_Timestamp] ON [AuditLogs] ([Timestamp]);
GO


CREATE UNIQUE INDEX [IX_BrandCategories_BrandId_Name] ON [BrandCategories] ([BrandId], [Name]);
GO


CREATE INDEX [IX_BrandCategories_BrandId_SortOrder] ON [BrandCategories] ([BrandId], [SortOrder]);
GO


CREATE UNIQUE INDEX [IX_Brands_MerchantUserId] ON [Brands] ([MerchantUserId]);
GO


CREATE INDEX [IX_Brands_UserId] ON [Brands] ([UserId]);
GO


CREATE UNIQUE INDEX [IX_Categories_Slug] ON [Categories] ([Slug]);
GO


CREATE INDEX [IX_CustomerAddresses_CustomerUserId] ON [CustomerAddresses] ([CustomerUserId]);
GO


CREATE INDEX [IX_CustomerAddresses_UserId] ON [CustomerAddresses] ([UserId]);
GO


CREATE INDEX [IX_MerchantShiftLines_MerchantShiftId] ON [MerchantShiftLines] ([MerchantShiftId]);
GO


CREATE INDEX [IX_MerchantShiftLines_ProductId] ON [MerchantShiftLines] ([ProductId]);
GO


CREATE INDEX [IX_MerchantShiftOrders_MerchantShiftId] ON [MerchantShiftOrders] ([MerchantShiftId]);
GO


CREATE INDEX [IX_MerchantShiftOrders_OrderId] ON [MerchantShiftOrders] ([OrderId]);
GO


CREATE INDEX [IX_MerchantShifts_BrandId] ON [MerchantShifts] ([BrandId]);
GO


CREATE UNIQUE INDEX [IX_MerchantShifts_InvoiceNumber] ON [MerchantShifts] ([InvoiceNumber]);
GO


CREATE INDEX [IX_MerchantShifts_Status] ON [MerchantShifts] ([Status]);
GO


CREATE INDEX [IX_MerchantSubscriptions_GraceEndDate] ON [MerchantSubscriptions] ([GraceEndDate]);
GO


CREATE INDEX [IX_MerchantSubscriptions_PlanId] ON [MerchantSubscriptions] ([PlanId]);
GO


CREATE UNIQUE INDEX [IX_MerchantSubscriptions_UserId] ON [MerchantSubscriptions] ([UserId]);
GO


CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);
GO


CREATE INDEX [IX_OrderItems_ProductId] ON [OrderItems] ([ProductId]);
GO


CREATE INDEX [IX_Orders_BrandId] ON [Orders] ([BrandId]);
GO


CREATE INDEX [IX_Orders_CustomerUserId] ON [Orders] ([CustomerUserId]);
GO


CREATE INDEX [IX_Orders_DeliveryAddressId] ON [Orders] ([DeliveryAddressId]);
GO


CREATE INDEX [IX_Orders_DeliveryUserId] ON [Orders] ([DeliveryUserId]);
GO


CREATE UNIQUE INDEX [IX_Orders_OrderNumber] ON [Orders] ([OrderNumber]);
GO


CREATE INDEX [IX_PaymentMethods_IsActive_SortOrder] ON [PaymentMethods] ([IsActive], [SortOrder]);
GO


CREATE INDEX [IX_ProductPhotos_ProductId] ON [ProductPhotos] ([ProductId]);
GO


CREATE INDEX [IX_Products_BrandId] ON [Products] ([BrandId]);
GO


CREATE INDEX [IX_Products_CategoryId] ON [Products] ([CategoryId]);
GO


CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);
GO


CREATE INDEX [IX_SubscriptionPaymentRequests_PlanId] ON [SubscriptionPaymentRequests] ([PlanId]);
GO


CREATE INDEX [IX_SubscriptionPaymentRequests_ReviewedByUserId] ON [SubscriptionPaymentRequests] ([ReviewedByUserId]);
GO


CREATE INDEX [IX_SubscriptionPaymentRequests_Status] ON [SubscriptionPaymentRequests] ([Status]);
GO


CREATE INDEX [IX_SubscriptionPaymentRequests_UserId_Status] ON [SubscriptionPaymentRequests] ([UserId], [Status]);
GO


CREATE UNIQUE INDEX [IX_SubscriptionPlans_Name] ON [SubscriptionPlans] ([Name]);
GO


CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
GO


CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO


