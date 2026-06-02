/* dark-mask.js - маскировка тёмных товаров */
(function () {
  // ID тёмной категории
  const DARK_CATEGORY_ID = 666;

  // Маска для всех тёмных товаров
  const MASK = {
    name: "Корень Мадндрагоры",
    product_name: "Корень Мадндрагоры",
    color: "Зелёный",
    size: "Стандартный",
    imageUrl: "/static/замена.png",
    description: "Много и сильно орёт",
  };

  // Проверка, является ли товар тёмным
  function isDarkItem(item) {
    return item.category_id === DARK_CATEGORY_ID;
  }

  // Применяет маску к товару (возвращает новый объект)
  function maskDarkItem(item) {
    if (!item) return item;

    // Если уже замаскирован — не маскируем повторно
    if (item._masked) return item;

    if (isDarkItem(item)) {
      return {
        ...item,
        name: MASK.name,
        product_name: MASK.name, // для корзины
        color: MASK.color,
        size: MASK.size,
        image_url: MASK.imageUrl,
        description: MASK.description,
        _masked: true, // флаг, что товар уже замаскирован
        _original_name: item.name || item.product_name,
        _original_color: item.color,
        _original_size: item.size,
      };
    }
    return item;
  }

  // Применяет маску ко всем товарам в массиве
  function maskDarkItems(items) {
    if (!items || !items.length) return items;
    return items.map((item) => maskDarkItem(item));
  }

  // Экспортируем глобально
  window.DarkMask = {
    isDarkItem,
    maskDarkItem,
    maskDarkItems,
    DARK_CATEGORY_ID,
    MASK,
  };
})();
