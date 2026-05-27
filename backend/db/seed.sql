INSERT OR IGNORE INTO Shops (ShopID, ShopName) VALUES
(1, 'Ollivanders'),
(2, 'Weasleys Wizard Wheezes'),
(3, 'Madam Malkins Robes');

INSERT OR IGNORE INTO Categories (CategoryID, CategoryName) VALUES
(1, 'Зелья'),
(2, 'Одежда'),
(3, 'Запрещённые артефакты'),
(4, 'Канцелярия');

INSERT OR IGNORE INTO Products (ProductID, ProductName, Price, Description, ImageURL, CategoryID, RequiredLevel, DeliveryType, ShopID) VALUES
(1, 'Набор перьев', 5.0, 'Качественные перья для письма, зачарованные на бесконечные чернила.', '/images/feathers.png', 4, 1, 'OWL', 1),
(2, 'Мантия Невидимости', 5000.0, 'Редчайший артефакт, делающий владельца полностью невидимым.', '/images/cloak.png', 2, 2, 'DELIVERY_GUY', 3),
(3, 'Феликс Фелицис', 1500.0, 'Жидкая удача. Обеспечивает везение на несколько часов.', '/images/felix.png', 1, 3, 'OWL', 1),
(4, 'Бомбы-пердёжки', 15.0, 'Весёлый сюрприз от братьев Уизли. Взрывается с громким хлопком.', '/images/puff.png', 3, 1, 'FIREPLACE', 2),
(5, 'Книга Запретных Заклинаний', 999.0, 'Сборник тёмной магии. Требует осторожности и высокого уровня доступа.', '/images/darkbook.png', 3, 4, 'DELIVERY_GUY', 1);

INSERT OR IGNORE INTO Items (ItemID, ProductID, Color, Size, StockQuantity) VALUES
(1, 1, 'Чёрный', '10шт', 100),
(2, 2, 'Серебристый', 'M', 5),
(3, 3, 'Золотистый', '50ml', 3),
(4, 4, 'Фиолетовый', '1шт', 50),
(5, 5, 'Кожаный', 'Стандарт', 1);

INSERT OR IGNORE INTO Users (UserID, FirstName, Surname, Email, PasswordHash, AccessLevel, TotalSpent) VALUES
(1, 'Гарри', 'Поттер', 'harry@hogwarts.edu', 'hash_1', 1, 0.0),
(2, 'Гермиона', 'Грейнджер', 'hermione@hogwarts.edu', 'hash_2', 1, 50.0),
(3, 'Сириус', 'Блэк', 'padfoot@order.org', 'hash_3', 2, 1200.0),
(4, 'Северус', 'Снейп', 'snape@hogwarts.edu', 'hash_4', 3, 0.0),
(5, 'Николас', 'Фламель', 'alchemist@paris.fr', 'hash_5', 3, 5000.0);

INSERT OR IGNORE INTO Cart (CartID, UserID) VALUES (1, 1), (2, 2);
INSERT OR IGNORE INTO CartItems (CartItemID, CartID, ItemID, Quantity) VALUES
(1, 1, 4, 2),
(2, 2, 1, 1);