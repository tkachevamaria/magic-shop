CREATE TABLE IF NOT EXISTS Shops (
    ShopID INTEGER PRIMARY KEY,
    ShopName TEXT
);

CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INTEGER PRIMARY KEY,
    CategoryName TEXT
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
    DeliveryType TEXT,
    ShopID INTEGER,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (ShopID) REFERENCES Shops(ShopID)
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
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE IF NOT EXISTS CartItems (
    CartItemID INTEGER PRIMARY KEY,
    CartID INTEGER,
    ItemID INTEGER,
    Quantity INTEGER,
    FOREIGN KEY (CartID) REFERENCES Cart(CartID),
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

CREATE TABLE IF NOT EXISTS Orders (
    OrderID INTEGER PRIMARY KEY,
    UserID INTEGER,
    ItemID TEXT,
    OrderDate DATETIME DEFAULT (datetime('now')),
    Status TEXT DEFAULT 'PENDING',
    DeliveryType TEXT,
    DeliveryAddress TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE IF NOT EXISTS Ratings (
    RatingID INTEGER PRIMARY KEY,
    UserID INTEGER,
    ProductID INTEGER,
    Score INTEGER,
    Comment TEXT,
    CreatedAt DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);