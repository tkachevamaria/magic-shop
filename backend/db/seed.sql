DELETE FROM Items; DELETE FROM Products; DELETE FROM CartItems; DELETE FROM Cart;

INSERT OR IGNORE INTO Shops (ShopID, ShopName) VALUES
(1, 'Ollivanders'), (2, 'Weasleys Wizard Wheezes'), (3, 'Madam Malkins Robes');

INSERT OR IGNORE INTO Categories (CategoryID, CategoryName) VALUES
(1, 'Зелья'), (2, 'Одежда'), (3, 'Канцелярия'), (4, 'Метлы'), (5, 'Зверинец'), (666, 'Тёмные артефакты');

INSERT OR IGNORE INTO Products (ProductID, ProductName, Price, CategoryID, RequiredLevel, DeliveryType, ShopID) VALUES
(1, 'Набор перьев', 5.0, 3, 1, 'OWL', 1),
(2, 'Мантия Невидимости', 5000.0, 2, 2, 'DELIVERY_GUY', 3),
(3, 'Феликс Фелицис', 1500.0, 1, 3, 'OWL', 1),
(4, 'Бомбы-пердёжки', 15.0, 666, 0, 'FIREPLACE', 2),
(5, 'Книга Запретных Заклинаний', 999.0, 666, 0, 'DELIVERY_GUY', 1),
(6, 'Нимбус 2000', 1200.0, 4, 2, 'OWL', 3),
(7, 'Амортенция', 800.0, 1, 3, 'FIREPLACE', 2),
(8, 'Сова-почтальон', 300.0, 5, 1, 'OWL', 1),
(9, 'Зелье многоликого', 2500.0, 1, 2, 'DELIVERY_GUY', 2),
(10, 'Мантия ученика', 150.0, 2, 1, 'OWL', 3),
(11, 'Чернильница самопишущая', 45.0, 3, 1, 'FIREPLACE', 1),
(12, 'Коготь дракона', 5000.0, 666, 0, 'OWL', 2);

INSERT OR IGNORE INTO Items (ItemID, ProductID, Color, Size, StockQuantity) VALUES
(1, 1, 'Чёрный', '10шт', 100), (2, 1, 'Синий', '5шт', 50),
(3, 2, 'Серебристый', 'M', 5), (4, 2, 'Серебристый', 'L', 2), (5, 2, 'Прозрачный', 'Детский', 8),
(6, 3, 'Золотистый', '50ml', 3), (7, 3, 'Золотистый', '25ml', 10),
(8, 4, 'Фиолетовый', '1шт', 50), (9, 4, 'Зелёный', '3шт', 20),
(10, 5, 'Кожаный', 'Стандарт', 1), (11, 5, 'Тканевый', 'Карманный', 4),
(12, 6, 'Тёмный дуб', 'Стандарт', 4), (13, 6, 'Светлый дуб', 'Укороченный', 2),
(14, 7, 'Розовый', '100ml', 7), (15, 7, 'Красный', '30ml', 12),
(16, 8, 'Белый', 'Взрослый', 3), (17, 8, 'Серый', 'Птенец', 5),
(18, 9, 'Изумрудный', '50ml', 6), (19, 9, 'Изумрудный', '200ml', 1),
(20, 10, 'Чёрный', 'M', 20), (21, 10, 'Чёрный', 'S', 15),
(22, 11, 'Стеклянный', 'Большой', 30), (23, 11, 'Стеклянный', 'Малый', 45),
(24, 12, 'Красный', 'Коготь', 2), (25, 12, 'Чёрный', 'Коготь', 1);

INSERT OR IGNORE INTO Users (UserID, FirstName, Surname, Email, PasswordHash, AccessLevel, TotalSpent) VALUES
(1, 'Гарри', 'Поттер', 'harry@hogwarts.edu', 'hash_1', 1, 0.0),
(2, 'Гермиона', 'Грейнджер', 'hermione@hogwarts.edu', 'hash_2', 1, 50.0),
(3, 'Сириус', 'Блэк', 'padfoot@order.org', 'hash_3', 2, 1200.0),
(4, 'Северус', 'Снейп', 'snape@hogwarts.edu', 'hash_4', 3, 0.0);

INSERT OR IGNORE INTO Cart (CartID, UserID) VALUES (1, 1), (2, 2);
INSERT OR IGNORE INTO CartItems (CartItemID, CartID, ItemID, Quantity) VALUES (1, 1, 8, 2), (2, 2, 22, 1);