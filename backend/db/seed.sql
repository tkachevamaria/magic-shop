-- 1. Справочники
INSERT OR IGNORE INTO Shops (ShopID, ShopName) VALUES
(1, 'Ollivanders'), (2, 'Weasleys Wizard Wheezes'), (3, 'Madam Malkins Robes');

INSERT OR IGNORE INTO Categories (CategoryID, CategoryName) VALUES
(1, 'Зелья'), (2, 'Одежда'), (3, 'Канцелярия'), (4, 'Метлы'), (5, 'Зверинец'), (666, 'Тёмные артефакты');

INSERT OR IGNORE INTO DeliveryMethods (DeliveryMethodID, Name, DurationDays) VALUES
(1, 'OWL', 1), (2, 'FIREPLACE', 0), (3, 'DELIVERY_GUY', 3);

-- 2. Пользователи
INSERT OR IGNORE INTO Users (UserID, FirstName, Surname, Email, PasswordHash, AccessLevel) VALUES
(1, 'Гарри', 'Поттер', 'harry@hogwarts.edu', 'hash_1', 1),
(2, 'Гермиона', 'Грейнджер', 'hermione@hogwarts.edu', 'hash_2', 1),
(3, 'Сириус', 'Блэк', 'padfoot@order.org', 'hash_3', 2),
(4, 'Северус', 'Снейп', 'snape@hogwarts.edu', 'hash_4', 3);

-- 3. Товары (разные уровни и способы доставки)
INSERT OR IGNORE INTO Products (ProductID, ProductName, Price, CategoryID, RequiredLevel, DeliveryMethodID, ShopID, ImageURL) VALUES
(1, 'Набор перьев', 5.0, 3, 1, 1, 1, '/images/1.png'),
(2, 'Мантия Невидимости', 5000.0, 2, 2, 3, 3, '/images/мантия.png'),
(3, 'Феликс Фелицис', 1500.0, 1, 3, 1, 1, '/images/felix.png'),
(4, 'Бомбы-пердёжки', 15.0, 666, 0, 2, 2, '/images/bombs.png');

--3. ТОвары (без фото)
INSERT OR IGNORE INTO Products (ProductID, ProductName, Price, CategoryID, RequiredLevel, DeliveryMethodID, ShopID) VALUES
(5, 'Книга Запретных Заклинаний', 999.0, 666, 0, 3, 1),
(6, 'Нимбус 2000', 1200.0, 4, 2, 1, 3),
(7, 'Амортенция', 800.0, 1, 3, 2, 2),
(8, 'Сова-почтальон', 300.0, 5, 1, 1, 1),
(9, 'Зелье многоликого', 2500.0, 1, 2, 3, 2),
(10, 'Мантия ученика', 150.0, 2, 1, 1, 3),
(11, 'Чернильница самопишущая', 45.0, 3, 1, 2, 1),
(12, 'Коготь дракона', 5000.0, 666, 0, 1, 2);

-- 4. Единицы товара (много вариантов цвета/размера)
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

-- 5. Корзины
INSERT OR IGNORE INTO Cart (CartID, UserID) VALUES (1, 1), (2, 2);
INSERT OR IGNORE INTO CartItems (CartItemID, CartID, ItemID, Quantity) VALUES (1, 1, 8, 2), (2, 2, 22, 1);

-- 6. Заказы (Тестовые данные для проверки Orders)
-- Заказ 1: Гарри, 2 товара, сова (1 день)
INSERT OR IGNORE INTO Orders (OrderID, UserID, ItemID, Status, DeliveryMethodID, OrderDate, EstimatedDeliveryDate, DeliveryAddress) VALUES
(1, 1, '1;8', 'PENDING', 1, datetime('now'), datetime('now', '+1 day'), 'Хогвартс, Гриффиндор');

-- Заказ 2: Гермиона, 1 товар, курьер (3 дня)
INSERT OR IGNORE INTO Orders (OrderID, UserID, ItemID, Status, DeliveryMethodID, OrderDate, EstimatedDeliveryDate, DeliveryAddress) VALUES
(2, 2, '2', 'PENDING', 3, datetime('now', '-1 day'), datetime('now', '+2 days'), 'Хогвартс, Библиотека');

-- Заказ 3: Сириус, 2 товара, камин (0 дней - уже сегодня)
INSERT OR IGNORE INTO Orders (OrderID, UserID, ItemID, Status, DeliveryMethodID, OrderDate, EstimatedDeliveryDate, DeliveryAddress) VALUES
(3, 3, '6;12', 'IN_TRANSIT', 2, datetime('now', '-2 hours'), datetime('now'), 'Лондон, Площадь Гриммо, 12');