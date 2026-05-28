-- 1. Справочники
INSERT INTO Shops (ShopID, ShopName) VALUES
(1, 'Ollivanders'), (2, 'Weasleys Wizard Wheezes'), (3, 'Madam Malkins Robes');

INSERT INTO Categories (CategoryID, CategoryName) VALUES
(1, 'Зелья'), (2, 'Одежда'), (3, 'Канцелярия'), (4, 'Метлы'), (5, 'Зверинец'), (666, 'Тёмные артефакты');

INSERT INTO DeliveryMethods (DeliveryMethodID, Name, DurationDays) VALUES
(1, 'OWL', 1), (2, 'FIREPLACE', 0), (3, 'DELIVERY_GUY', 3);

-- 2. Пользователи
INSERT INTO Users (UserID, FirstName, Surname, Email, PasswordHash, AccessLevel) VALUES
(1, 'Гарри', 'Поттер', 'harry@hogwarts.edu', 'hash_1', 1),
(2, 'Гермиона', 'Грейнджер', 'hermione@hogwarts.edu', 'hash_2', 1),
(3, 'Сириус', 'Блэк', 'padfoot@order.org', 'hash_3', 2),
(4, 'Северус', 'Снейп', 'snape@hogwarts.edu', 'hash_4', 3);

-- 3. Товары (DeliveryMethodID ссылается на DeliveryMethods)
INSERT INTO Products (ProductID, ProductName, Price, CategoryID, RequiredLevel, DeliveryMethodID, ShopID) VALUES
(1, 'Набор перьев', 5.0, 4, 1, 1, 1),
(2, 'Мантия Невидимости', 5000.0, 2, 2, 3, 3),
(3, 'Феликс Фелицис', 1500.0, 1, 3, 1, 1),
(4, 'Бомбы-пердёжки', 15.0, 666, 0, 2, 2),
(5, 'Книга Запретных Заклинаний', 999.0, 666, 0, 3, 1);

-- 4. Конкретные единицы
INSERT INTO Items (ItemID, ProductID, Color, Size, StockQuantity) VALUES
(1, 1, 'Чёрный', '10шт', 100), (2, 2, 'Серебристый', 'M', 5),
(3, 3, 'Золотистый', '50ml', 3), (4, 4, 'Фиолетовый', '1шт', 50),
(5, 5, 'Кожаный', 'Стандарт', 1);

-- 5. Корзины (вставляются ПОСЛЕ Users и Items)
INSERT INTO Cart (CartID, UserID) VALUES (1, 1), (2, 2);
INSERT INTO CartItems (CartItemID, CartID, ItemID, Quantity) VALUES
(1, 1, 4, 2),
(2, 2, 1, 1);