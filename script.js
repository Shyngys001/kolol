const isCatalogPage = window.location.pathname.endsWith('catalog.html');

// Состояние приложения
const state = {
  categories: [],
  products: [],
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  favorites: JSON.parse(localStorage.getItem('favorites')) || [],
  currentCategory: 'all',
  currentProduct: null,
  searchTerm: ''
};

// Ссылки на DOM-элементы
const elements = {
  categoriesContainer: document.getElementById('categories-container'),
  productsContainer: document.getElementById('products-container'),
  cartBtn: document.getElementById('cart-btn'),
  cartDrawer: document.getElementById('cart-drawer'),
  closeCart: document.getElementById('close-cart'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartCount: document.getElementById('cart-count'),
  favoritesBtn: document.getElementById('favorites-btn'),
  favoritesCount: document.getElementById('favorites-count'),
  checkoutBtn: document.getElementById('checkout-btn'),
  productModal: document.getElementById('product-modal'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.querySelector('.modal-close'),
  sortSelect: document.getElementById('sort'),
  menuBtn: document.getElementById('menu-btn'),
  nav: document.querySelector('.nav'),
  categoryFilter: document.getElementById('category-filter'),
};

// Стартуем
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await fetchData();

  if (!isCatalogPage) {
    // Главная: только категории
    renderCategories();
    return;
  }

  populateCategoryFilter();
  applyCategoryFromUrl();
  renderProducts();
  updateCartCount();
  updateFavoritesCount();
  setupEventListeners();
}

// Извлекаем ?category= из URL
function applyCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('category')) {
    state.currentCategory = params.get('category');
  }
}

// Преобразуем Drive-ссылку в прямую картинку
// function normalizeDriveUrl(url) {
//     if (!url) return url;
    
//     // Ищем ID в двух вариантах ссылок:
//     // 1) /file/d/ID/view
//     // 2) /d/ID/
//     const m = url.match(/(?:\/file\/d\/|\/d\/)([a-zA-Z0-9_-]+)/);
//     const id = m && m[1];
    
//     // Добавляем параметр конвертации в формат изображения
//     return id
//         ? `https://drive.google.com/uc?export=download&format=img&id=${id}`
//         : url;
// }

// Временная заглушка для проверки
function normalizeDriveUrl(url) {
    if (!url) return url;
    
    // Обрабатываем все форматы ссылок Google Drive
    const patterns = [
        /\/d\/([a-zA-Z0-9_-]+)/,
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /[a-zA-Z0-9_-]{25,}/  // Ищем длинные ID напрямую
    ];
    
    let id = null;
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            id = match[1];
            break;
        }
    }
    
    // Если нашли ID - формируем прямую ссылку на изображение
    return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
}


// Загрузка и нормализация данных из Google Sheets
async function fetchData() {
    try {
      // Категории
      const catRes = await fetch(
        'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Категории&tqx=out:json'
      );
      const catText = await catRes.text();
      state.categories = parseSheet(catText).map(cat => ({
        ...cat,
        'URL-картинки': normalizeDriveUrl(cat['URL-картинки'])
      }));
  
      // Товары
      const prodRes = await fetch(
        'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Товары&tqx=out:json'
      );
      const prodText = await prodRes.text();
      state.products = parseSheet(prodText).map(prod => ({
        ...prod,
        image_url1: normalizeDriveUrl(prod.image_url1),
        image_url2: normalizeDriveUrl(prod.image_url2),
        image_url3: normalizeDriveUrl(prod.image_url3)
      }));


      console.group('Loaded products');
state.products.forEach((p, i) => {
  console.log(
    `%c[${i}] keys:`, 'color:teal;font-weight:bold;',
    Object.keys(p)
  );
  console.log(
    `%c[${i}] image_url1:`, 'color:purple;',
    p.image_url1
  );
});
console.groupEnd();

    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    }
  }
  

// Универсальный парсер GViz → Array<obj>
function parseSheet(resText) {
  const jsonStr = resText.match(/setResponse\(([\s\S]+)\);/)[1];
  const data = JSON.parse(jsonStr).table;
  const cols = data.cols.map(c => c.label);
  return data.rows.map(r => {
    const obj = {};
    r.c.forEach((cell, i) => {
      if (cell) obj[cols[i]] = cell.v;
    });
    return obj;
  });
}

// Рендерим категории
function renderCategories() {
  elements.categoriesContainer.innerHTML = '';
  state.categories.forEach(cat => {
    const a = document.createElement('a');
    a.href = `catalog.html?category=${cat.id}`;
    a.className = 'category-card';
    a.innerHTML = `
      <img src="${cat['URL-картинки']}" alt="${cat['название']}">
      <h3>${cat['название']}</h3>
    `;
    elements.categoriesContainer.appendChild(a);
  });
}

// Заполняем выпадашку фильтра
function populateCategoryFilter() {
  const sel = elements.categoryFilter;
  sel.innerHTML = '<option value="all">Все категории</option>';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = String(cat.id);
    opt.textContent = cat['название'];
    sel.appendChild(opt);
  });
  sel.value = state.currentCategory;
}


// Рендер товаров
function renderProducts() {
        elements.productsContainer.innerHTML = '';
        let items = [...state.products];

        
      
        // По категории
        if (state.currentCategory !== 'all') {
          items = items.filter(p => String(p.category_id) === state.currentCategory);
        }
        // По сортировке
        const sort = elements.sortSelect.value;
        if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
        else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
        else if (sort === 'sale')
          items.sort((a, b) => (b.old_price - b.price) - (a.old_price - a.price));
      
        // Вставляем в DOM
        items.forEach(p => {
          const isFav = state.favorites.includes(p.id);
          const card = document.createElement('div');
          card.className = 'product-card';
          card.innerHTML = `
            <div class="product-image">
              <img src="${p.image_url1}" alt="${p.name}">
              ${p.old_price ? `<div class="sale-badge">-${Math.round((1 - p.price/p.old_price)*100)}%</div>` : ''}
            </div>
            <div class="product-details">
              <h3>${p.name}</h3>
              <div class="product-price">
                ${p.old_price ? `<span class="old-price">${p.old_price} ₸</span>` : ''}
                <span class="current-price">${p.price} ₸</span>
              </div>
            </div>
            <div class="product-actions">
              <button class="heart-btn ${isFav?'active':''}" data-id="${p.id}">
                <i class="${isFav?'fas':'far'} fa-heart"></i>
              </button>
              <button class="btn-primary add-to-cart" data-id="${p.id}">В корзину</button>
            </div>
          `;
          elements.productsContainer.appendChild(card);
        });
      }
  
  // В setupEventListeners добавляем обработчик для <select id="category-filter">
  elements.categoryFilter.addEventListener('change', e => {
    state.currentCategory = e.target.value;
    renderProducts();
  });

// Рендер модального окна товара
function renderProductModal(productId) {
    const product = state.products.find(p => p.id == productId);
    if (!product) return;
    
    state.currentProduct = product;
    
    const isFavorite = state.favorites.includes(product.id);
    
    elements.modalBody.innerHTML = `
        <div class="modal-images">
            <div class="modal-main-image">
                <img src="${product['image_url1']}" alt="${product.название}" id="main-image">
            </div>
            <div class="modal-thumbnails">
                <div class="modal-thumbnail active" data-image="${product['image_url1']}">
                    <img src="${product['image_url1']}" alt="Thumbnail 1">
                </div>
                ${product['image_url2'] ? `
                <div class="modal-thumbnail" data-image="${product['image_url2']}">
                    <img src="${product['image_url2']}" alt="Thumbnail 2">
                </div>
                ` : ''}
                ${product['image_url3'] ? `
                <div class="modal-thumbnail" data-image="${product['image_url3']}">
                    <img src="${product['image_url3']}" alt="Thumbnail 3">
                </div>
                ` : ''}
            </div>
        </div>
        <div class="modal-info">
            <h2 class="modal-title">${product.name}</h2>
            <div class="modal-price">
                <span class="modal-current-price">${product.price} ₸</span>
                ${product.old_price ? `<span class="modal-old-price">${product.old_price} ₸</span>` : ''}
            </div>
            <p class="modal-description">${product.description || 'Премиальное качество для вашего ребенка'}</p>
            
            <div class="modal-sizes">
                <h4>Размеры:</h4>
                <div class="size-options">
                    ${['XS', 'XXS', 'S', 'M', 'L', 'XL'].map(size => `
                        <div class="size-option" data-size="${size}">${size}</div>
                    `).join('')}
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="heart-btn ${isFavorite ? 'active' : ''}" data-id="${product.id}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    ${isFavorite ? 'В избранном' : 'В избранное'}
                </button>
                <button class="btn-primary add-to-cart-modal" data-id="${product.id}">Добавить в корзину</button>
            </div>
        </div>
    `;
    
    elements.productModal.classList.add('active');
}

// Рендер корзины
function renderCart() {
    elements.cartItems.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
        elements.cartTotal.textContent = '0';
        return;
    }
    
    let total = 0;
    
    state.cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-price">${item.price} ₸ × ${item.quantity}</p>
                <p class="cart-item-size">Размер: ${item.size}</p>
                <div class="cart-item-actions">
                    <button class="quantity-btn minus" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-index="${index}">+</button>
                    <button class="remove-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        elements.cartItems.appendChild(cartItem);
    });
    
    elements.cartTotal.textContent = total.toLocaleString();
}

// Обновление счетчика корзины
function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = count;
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

// Обновление счетчика избранного
function updateFavoritesCount() {
    elements.favoritesCount.textContent = state.favorites.length;
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

// Добавление в корзину
function addToCart(productId, size = '86') {
    const product = state.products.find(p => p.id == productId);
    if (!product) return;
    
    const existingItemIndex = state.cart.findIndex(
        item => item.id == productId && item.size == size
    );
    
    if (existingItemIndex !== -1) {
        // Увеличиваем количество существующего товара
        state.cart[existingItemIndex].quantity += 1;
    } else {
        // Добавляем новый товар
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product['image_url1'],
            size: size,
            quantity: 1
        });
    }
    
    updateCartCount();
    renderCart();
    
    // Анимация добавления
    elements.cartCount.style.transform = 'scale(1.5)';
    setTimeout(() => {
        elements.cartCount.style.transform = 'scale(1)';
    }, 300);
}

// Переключение избранного
function toggleFavorite(productId) {
    const id = Number(productId);
    const idx = state.favorites.indexOf(id);
    if (idx > -1) {
        state.favorites.splice(idx, 1);
    } else {
        state.favorites.push(id);
    }
    updateFavoritesCount();
    renderProducts();
    if (state.currentProduct) renderProductModal(state.currentProduct.id);
}

// Оформление заказа через WhatsApp
function checkout() {
    if (state.cart.length === 0) return;
    
    const phone = '77479894879';
    let message = 'Здравствуйте! Я хочу заказать:%0A%0A';
    
    state.cart.forEach(item => {
        message += `- ${item.name} (Размер: ${item.size}) - ${item.quantity} шт. × ${item.price} ₸%0A`;
    });
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `%0AИтого: ${total} ₸%0A%0AСпасибо!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация по категориям
    document.querySelectorAll('[data-category]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            state.currentCategory = button.dataset.category;
            renderProducts();
            
            // Прокрутка к каталогу
            document.getElementById('catalog').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    elements.searchInput = document.getElementById('search-input');
    elements.searchInput.addEventListener('input', e => {
    state.searchTerm = e.target.value;
    renderProducts();
    });

    elements.categoryFilter.addEventListener('change', e => {
        state.currentCategory = e.target.value;
        renderProducts();
    });
      elements.sortSelect.addEventListener('change', renderProducts);
    
    // Фильтры и сортировка
    elements.sortSelect.addEventListener('change', renderProducts);
    
    // Открытие корзины
    elements.cartBtn.addEventListener('click', () => {
        elements.cartDrawer.classList.add('active');
        renderCart();
    });
    
    // Закрытие корзины
    elements.closeCart.addEventListener('click', () => {
        elements.cartDrawer.classList.remove('active');
    });
    
    // Оформление заказа
    elements.checkoutBtn.addEventListener('click', checkout);
    
    // Закрытие модального окна
    elements.modalClose.addEventListener('click', () => {
        elements.productModal.classList.remove('active');
    });
    
    // Клик по фону для закрытия модалки
    elements.productModal.addEventListener('click', (e) => {
        if (e.target === elements.productModal) {
            elements.productModal.classList.remove('active');
        }
    });
    
    // Бургер-меню
    elements.menuBtn.addEventListener('click', () => {
        elements.nav.classList.toggle('active');
    });
    
    // Обработчики событий для динамических элементов
    document.addEventListener('click', (e) => {
        // Карточка товара
        if (e.target.closest('.product-card')) {
            const card = e.target.closest('.product-card');
            const productId = card.querySelector('.add-to-cart').dataset.id;
            renderProductModal(productId);
        }
        
        // Кнопка "В корзину"
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.dataset.id;
            addToCart(productId);
        }
        
        // Кнопка "В избранное"
        if (e.target.classList.contains('heart-btn') || e.target.closest('.heart-btn')) {
            const btn = e.target.closest('.heart-btn');
            const productId = btn.dataset.id;
            toggleFavorite(productId);
        }
        
        // Миниатюры в модалке
        if (e.target.closest('.modal-thumbnail')) {
            const thumbnail = e.target.closest('.modal-thumbnail');
            const mainImage = document.getElementById('main-image');
            mainImage.src = thumbnail.dataset.image;
            
            // Обновление активной миниатюры
            document.querySelectorAll('.modal-thumbnail').forEach(t => {
                t.classList.remove('active');
            });
            thumbnail.classList.add('active');
        }
        
        // Выбор размера
        if (e.target.classList.contains('size-option')) {
            const sizeOption = e.target;
            
            // Обновление активного размера
            document.querySelectorAll('.size-option').forEach(option => {
                option.classList.remove('selected');
            });
            sizeOption.classList.add('selected');
        }
        
        // Кнопка "Добавить в корзину" в модалке
        if (e.target.classList.contains('add-to-cart-modal')) {
            const btn = e.target;
            const productId = btn.dataset.id;
            const selectedSize = document.querySelector('.size-option.selected');
            
            if (!selectedSize) {
                alert('Пожалуйста, выберите размер');
                return;
            }
            
            addToCart(productId, selectedSize.dataset.size);
            elements.cartDrawer.classList.add('active');
            renderCart();
            elements.productModal.classList.remove('active');
        }
        
        // Управление количеством в корзине
        if (e.target.classList.contains('quantity-btn')) {
            const btn = e.target;
            const index = btn.dataset.index;
            
            if (btn.classList.contains('plus')) {
                state.cart[index].quantity += 1;
            } else if (btn.classList.contains('minus')) {
                if (state.cart[index].quantity > 1) {
                    state.cart[index].quantity -= 1;
                } else {
                    state.cart.splice(index, 1);
                }
            }
            
            updateCartCount();
            renderCart();
        }
        
        // Удаление товара из корзины
        if (e.target.classList.contains('remove-btn') || e.target.closest('.remove-btn')) {
            const btn = e.target.closest('.remove-btn');
            const index = btn.dataset.index;
            state.cart.splice(index, 1);
            updateCartCount();
            renderCart();
        }
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);


// Новые элементы
elements.favoritesDrawer = document.getElementById('favorites-drawer');
elements.favoritesItems  = document.getElementById('favorites-items');
elements.closeFavorites  = document.getElementById('close-favorites');

// Функция рендера избранного
function renderFavorites() {
  elements.favoritesItems.innerHTML = '';
  if (!state.favorites.length) {
    elements.favoritesItems.innerHTML = '<p>Список избранного пуст</p>';
    return;
  }
  state.favorites.forEach(id => {
    const p = state.products.find(pr => pr.id == id);
    if (!p) return;
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `
      <img src="${p.image_url1}" alt="${p.name}">
      <div class="favorite-details">
        <h4>${p.name}</h4>
        <p>${p.price} ₸</p>
        <div class="favorite-actions">
          <button class="btn-primary add-to-cart-from-fav" data-id="${p.id}">В корзину</button>
          <button class="btn-remove-fav" data-id="${p.id}">&times; Убрать</button>
        </div>
      </div>
    `;
    elements.favoritesItems.appendChild(div);
  });
}

// Открытие/закрытие избранного
elements.favoritesBtn.addEventListener('click', () => {
  renderFavorites();
  elements.favoritesDrawer.classList.add('active');
});
elements.closeFavorites.addEventListener('click', () => {
  elements.favoritesDrawer.classList.remove('active');
});

// Делаем делегирование кликов внутри документа
document.addEventListener('click', e => {
  // Убрать из избранного
// Новый код — сравниваем всё как строки
    if (e.target.classList.contains('btn-remove-fav')) {
        const id = e.target.dataset.id;               // оставляем строку
        state.favorites = state.favorites.filter(     // приводим fid к строке
        fid => String(fid) !== id
        );
        updateFavoritesCount();
        renderFavorites();
        renderProducts();
    }

  // Добавить из избранного в корзину
  if (e.target.classList.contains('add-to-cart-from-fav')) {
    const id = e.target.dataset.id;
    addToCart(id);
    updateCartCount();
  }
});