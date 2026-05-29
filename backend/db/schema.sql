CREATE TABLE IF NOT EXISTS Shops (
    ShopID INTEGER PRIMARY KEY,
    ShopName TEXT
);

CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INTEGER PRIMARY KEY,
    CategoryName TEXT
);

CREATE TABLE IF NOT EXISTS DeliveryMethods (
    DeliveryMethodID INTEGER PRIMARY KEY,
    Name TEXT NOT NULL,
    DurationDays INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY,
    FirstName TEXT,
    Surname TEXT,
    Email TEXT UNIQUE,
    PasswordHash TEXT,
    AccessLevel INTEGER,
    TotalSpent REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS Products (
    ProductID INTEGER PRIMARY KEY,
    ProductName TEXT,
    Price REAL,
    CategoryID INTEGER,
    RequiredLevel INTEGER,
    DeliveryMethodID INTEGER,
    ShopID INTEGER,
    ImageURL TEXT DEFAULT '/images/default.png',
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (ShopID) REFERENCES Shops(ShopID),
    FOREIGN KEY (DeliveryMethodID) REFERENCES DeliveryMethods(DeliveryMethodID)
);

CREATE TABLE IF NOT EXISTS Items (
    ItemID INTEGER PRIMARY KEY,
    ProductID INTEGER,
    Color TEXT,
    Size TEXT,
    StockQuantity INTEGER DEFAULT 0,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

CREATE TABLE IF NOT EXISTS Cart (
    CartID INTEGER PRIMARY KEY,
    UserID INTEGER UNIQUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CartItems (
    CartItemID INTEGER PRIMARY KEY,
    CartID INTEGER,
    ItemID INTEGER,
    Quantity INTEGER,
    FOREIGN KEY (CartID) REFERENCES Cart(CartID) ON DELETE CASCADE,
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID),
    UNIQUE(CartID, ItemID)
);

CREATE TABLE IF NOT EXISTS Orders (
    OrderID INTEGER PRIMARY KEY,
    UserID INTEGER,
    ItemID TEXT,
    OrderDate DATETIME DEFAULT (datetime('now')),
    Status TEXT DEFAULT 'PENDING',
    DeliveryMethodID INTEGER,
    EstimatedDeliveryDate DATETIME,
    DeliveryAddress TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (DeliveryMethodID) REFERENCES DeliveryMethods(DeliveryMethodID)
);