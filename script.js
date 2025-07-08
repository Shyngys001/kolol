// Проверяем, находимся ли на странице каталога
const isCatalogPage = window.location.pathname.includes('catalog.html');

// Состояние приложения
const state = {
  categories: [],
  products: [],
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  favorites: JSON.parse(localStorage.getItem('favorites')) || [],
  currentCategory: 'all',
  currentProduct: null,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 6,
  filterColor: '',
  filterSize: ''
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
  nav: document.querySelector('nav'),
  categoryFilter: document.getElementById('category-filter'),
  searchInput: document.getElementById('search-input'),
  favoritesDrawer: document.getElementById('favorites-drawer'),
  favoritesItems: document.getElementById('favorites-items'),
  closeFavorites: document.getElementById('close-favorites'),
  paginationContainer: document.getElementById('pagination-container'),
};

// Преобразуем Drive-ссылку в прямую картинку
function normalizeDriveUrl(url) {
  if (!url) return '';
  
  const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /[a-zA-Z0-9_-]{25,}/
  ];
  
  let id = null;
  for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
          id = match[1];
          break;
      }
  }
  
  return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
}

// Загрузка данных из Google Sheets
async function fetchData() {
  try {
    // Категории
    const catRes = await fetch(
      'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Категории&tqx=out:json'
    );
    const catText = await catRes.text();
    const catJson = JSON.parse(catText.substring(47, catText.length-2));
    const catRows = catJson.table.rows;
    
    state.categories = catRows.map(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
        if (cell) obj[catJson.table.cols[i].label] = cell.v;
      });
      return {
        id: obj.id || '',
        name: obj['название'] || 'Категория',
        image: normalizeDriveUrl(obj['URL-картинки']) || 'https://via.placeholder.com/400'
      };
    });

    // Товары
    const prodRes = await fetch(
      'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Товары&tqx=out:json'
    );
    const prodText = await prodRes.text();
    const prodJson = JSON.parse(prodText.substring(47, prodText.length-2));
    const prodRows = prodJson.table.rows;
    
    state.products = prodRows.map(row => {
      const obj = {};
       row.c.forEach((cell, i) => {
         if (cell) obj[prodJson.table.cols[i].label] = cell.v;
       });
      return {
        id: String(obj.id || ''),
        name: obj.name || 'Товар',
        category_id: String(obj.category_id || ''),
        description: obj.description || 'Описание отсутствует',
        price: obj.price ? parseFloat(obj.price) : 0,
        old_price: obj.old_price ? parseFloat(obj.old_price) : 0,
        image1: normalizeDriveUrl(obj.image_url1) || 'https://via.placeholder.com/400',
        image2: normalizeDriveUrl(obj.image_url2) || '',
        image3: normalizeDriveUrl(obj.image_url3) || '',
        sizes: obj.SIZE
        ? obj.SIZE.toString().split(/\s+|,\s*/).filter(s=>s)
        : [],
        colors: obj.COLOR
        ? obj.COLOR.toString().split(/\s+|,\s*/).filter(c=>c)
        : []
      };
    });
    
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    return false;
  }
  return true;
}


function populateExtraFilters() {
  // собираем все уникальные цвета и размеры
  const allColors = new Set();
  const allSizes  = new Set();
  state.products.forEach(p => {
    p.colors.forEach(c => allColors.add(c));
    p.sizes .forEach(s => allSizes.add(s));
  });

  // наполняем select#color-filter
  const cf = document.getElementById('color-filter');
  allColors.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    cf.appendChild(opt);
  });

  // наполняем select#size-filter
  const sf = document.getElementById('size-filter');
  allSizes.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sf.appendChild(opt);
  });
}

// Рендерим категории на главной странице
function renderCategories() {
  if (!state.categories.length || !elements.categoriesContainer) return;
  
  elements.categoriesContainer.innerHTML = '';
  
  state.categories.forEach(cat => {
    const a = document.createElement('a');
    a.href = `catalog.html?category=${cat.id}`;
    a.className = 'category-card';
    a.innerHTML = `
      <img src="${cat.image}" alt="${cat.name}">
      <h3>${cat.name}</h3>
    `;
    elements.categoriesContainer.appendChild(a);
  });
}

// Рендер пагинации
function renderPagination(totalPages) {
  if (!elements.paginationContainer) return;
  
  elements.paginationContainer.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Кнопка "Назад"
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '&laquo;';
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderProducts();
    }
  });
  elements.paginationContainer.appendChild(prevBtn);
  
  // Номера страниц
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === state.currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      state.currentPage = i;
      renderProducts();
    });
    elements.paginationContainer.appendChild(pageBtn);
  }
  
  // Кнопка "Вперед"
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '&raquo;';
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderProducts();
    }
  });
  elements.paginationContainer.appendChild(nextBtn);
}

// Рендер товаров в каталоге
function renderProducts() {
  if (!elements.productsContainer) return;
  
  elements.productsContainer.innerHTML = '';
  let items = [...state.products];
  
  // Фильтрация по категории
  if (state.currentCategory !== 'all') {
    items = items.filter(p => String(p.category_id) === state.currentCategory);
  }
  
  // Фильтрация по поиску
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(term));
  }
  
  // Сортировка
  const sort = elements.sortSelect ? elements.sortSelect.value : 'default';
  if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'sale') {
    items.sort((a, b) => {
      const discountA = a.old_price ? a.old_price - a.price : 0;
      const discountB = b.old_price ? b.old_price - b.price : 0;
      return discountB - discountA;
    });
  }


  if (state.filterColor) {
    items = items.filter(p => p.colors.includes(state.filterColor));
  }
  if (state.filterSize) {
    items = items.filter(p => p.sizes.includes(state.filterSize));
  }

  // Рассчитываем пагинацию
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = Math.min(startIndex + state.itemsPerPage, totalItems);
  const itemsToRender = items.slice(startIndex, endIndex);
  
  // Если нет товаров
  if (itemsToRender.length === 0) {
    elements.productsContainer.innerHTML = '<p class="no-products">Товары не найдены</p>';
    renderPagination(totalPages);
    return;
  }

  // helper: получить имя категории по её id
function getCategoryName(id) {
  const cat = state.categories.find(c => c.id === id);
  return cat ? cat.name : '';
}
  
  // Рендер товаров (ТОЛЬКО ДЛЯ ТЕКУЩЕЙ СТРАНИЦЫ)
  itemsToRender.forEach(p => {
    const isFav = state.favorites.includes(p.id);
    // достаём имя категории, HTML для размеров и цветов
    const categoryName = getCategoryName(p.category_id);
    const sizesHTML    = p.sizes.map(s => `<span class="size-tag">${s}</span>`).join('');
    const colorsHTML   = p.colors.map(c=> `<span class="color-tag">${c}</span>`).join('');
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${p.image1}" alt="${p.name}">
        ${p.old_price ? `<div class="sale-badge">-${Math.round((1 - p.price/p.old_price)*100)}%</div>` : ''}
      </div>
      <div class="product-details">
        <!-- НАЗВАНИЕ КАТЕГОРИИ -->
        <div class="product-category">${categoryName}</div>
        <h3>${p.name}</h3>
        <div class="product-price">
          ${p.old_price ? `<span class="old-price">${p.old_price} ₸</span>` : ''}
          <span class="current-price">${p.price} ₸</span>
        </div>
      </div>
      <!-- СПИСОК РАЗМЕРОВ -->
      ${ p.sizes.length 
        ? `<div class="product-sizes">${sizesHTML}</div>`
        : ``
      }
      <!-- СПИСОК ЦВЕТОВ -->
      ${ p.colors.length
        ? `<div class="product-colors">${colorsHTML}</div>`
        : ``
      }
      <div class="product-actions">
        <button class="heart-btn ${isFav ? 'active' : ''}" data-id="${p.id}">
          <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <button class="btn-primary add-to-cart" data-id="${p.id}">В корзину</button>
      </div>
    `;
    elements.productsContainer.appendChild(card);
  });



  // Рендерим пагинацию
  renderPagination(totalPages);


}

// Заполняем выпадающий список категорий
function populateCategoryFilter() {
  if (!elements.categoryFilter) return;
  
  const sel = elements.categoryFilter;
  sel.innerHTML = '<option value="all">Все категории</option>';
  
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
  
  // Устанавливаем текущую категорию из URL
  const params = new URLSearchParams(window.location.search);
  if (params.has('category')) {
    state.currentCategory = params.get('category');
    sel.value = state.currentCategory;
  }
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
function addToCart(productId, size = '', color = '') {
  const product = state.products.find(p=>p.id==productId);
  if (!product) return;
  
  const existingItemIndex = state.cart.findIndex(item=>
    item.id==productId && item.size==size && item.color==color
  );
  
  if (existingItemIndex !== -1) {
    state.cart[existingItemIndex].quantity += 1;
  } else {
    state.cart.push({
      id:product.id,
      name:product.name,
      price:product.price,
      image:product.image1,
      size:size,
      color:color,
      quantity:1
    });
  }
  
  updateCartCount();
  
  // Анимация добавления
  elements.cartCount.style.transform = 'scale(1.5)';
  setTimeout(() => {
    elements.cartCount.style.transform = 'scale(1)';
  }, 300);
  
  // Показываем уведомление
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check"></i> Товар добавлен в корзину`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

// Переключение избранного
function toggleFavorite(productId) {
  const id = String(productId);
  const idx = state.favorites.indexOf(id);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.push(id);
  }
  updateFavoritesCount();
  
  // Обновляем отображение товаров в каталоге
  if (isCatalogPage) renderProducts();
}

// Оформление заказа через WhatsApp
function checkout() {
  if (state.cart.length === 0) return;

  const phone = '77020072268';
  let text = '*🛒 Новый заказ с MonnaRosa.kz*\n\n';
  text += 'Здравствуйте! Хочу заказать: }:\n\n';

  state.cart.forEach((item, i) => {
    text += `${i + 1}. *${item.name}*\n`;
    text += `   Размер: _${item.size}_\n`;
    text += `   Кол-во: *${item.quantity}* шт.\n`;
    text += `   Цена: *${item.price.toLocaleString()} ₸*\n\n`;
    text += `   Цвет: *${item.color.toLocaleString()}*\n\n`;
  });

  const total = state.cart
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toLocaleString();
  text += `*Итого:* _${total} ₸_\n\n`;

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

// Рендер корзины
function renderCart() {
  if (!elements.cartItems) return;
  
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
        <p class="cart-item-size">Размер: ${item.size}, Цвет: ${item.color}</p>
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

// Рендер избранного
function renderFavorites() {
  if (!elements.favoritesItems) return;
  
  elements.favoritesItems.innerHTML = '';
  
  if (state.favorites.length === 0) {
    elements.favoritesItems.innerHTML = '<p class="empty-favorites">Список избранного пуст</p>';
    return;
  }
  
  state.favorites.forEach(id => {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const favItem = document.createElement('div');
    favItem.className = 'favorite-item';
    favItem.innerHTML = `
      <img src="${product.image1}" alt="${product.name}">
      <div class="favorite-details">
        <h4>${product.name}</h4>
        <p>${product.price} ₸</p>
        <div class="favorite-actions">
          <button class="btn-primary add-to-cart-from-fav" data-id="${product.id}">В корзину</button>
          <button class="btn-remove-fav" data-id="${product.id}">&times; Убрать</button>
        </div>
      </div>
    `;
    elements.favoritesItems.appendChild(favItem);
  });
}

// Рендер модального окна товара
function renderProductModal(productId) {
  const product = state.products.find(p => p.id == productId);
  if (!product) return;
  
  const isFavorite = state.favorites.includes(product.id);
  
  elements.modalBody.innerHTML = `
    <div class="modal-images">
      <div class="modal-main-image">
        <img src="${product.image1}" alt="${product.name}" id="main-image">
      </div>
      <div class="modal-thumbnails">
        <div class="modal-thumbnail active" data-image="${product.image1}">
          <img src="${product.image1}" alt="Thumbnail 1">
        </div>
        ${product.image2 ? `
        <div class="modal-thumbnail" data-image="${product.image2}">
          <img src="${product.image2}" alt="Thumbnail 2">
        </div>
        ` : ''}
        ${product.image3 ? `
        <div class="modal-thumbnail" data-image="${product.image3}">
          <img src="${product.image3}" alt="Thumbnail 3">
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
      
      ${product.sizes.length?`
      
        <div class="modal-sizes">
        <h4>Размеры:</h4>
        <div class="size-options">
          ${product.sizes.map(s=>`
            <div class="size-option" data-size="${s}">${s}</div>
          `).join('')}
        </div>
      </div>`:``}

      ${product.colors.length?`
      <div class="modal-colors">
        <h4>Цвета:</h4>
        <div class="color-options">
          ${product.colors.map(c=>`
            <div class="color-option" data-color="${c}">${c}</div>
          `).join('')}
        </div>
      </div>`:``}
      
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

// Настройка обработчиков событий
function setupEventListeners() {
  // Открытие корзины
  if (elements.cartBtn) {
    elements.cartBtn.addEventListener('click', () => {
      elements.cartDrawer.classList.add('active');
      renderCart();
    });
  }
  
  // Закрытие корзины
  if (elements.closeCart) {
    elements.closeCart.addEventListener('click', () => {
      elements.cartDrawer.classList.remove('active');
    });
  }
  
  // Оформление заказа
  if (elements.checkoutBtn) {
    elements.checkoutBtn.addEventListener('click', checkout);
  }
  
  // Закрытие модального окна
  if (elements.modalClose) {
    elements.modalClose.addEventListener('click', () => {
      elements.productModal.classList.remove('active');
    });
  }
  
  // Клик по фону для закрытия модалки
  if (elements.productModal) {
    elements.productModal.addEventListener('click', (e) => {
      if (e.target === elements.productModal) {
        elements.productModal.classList.remove('active');
      }
    });
  }
  
  // Бургер-меню
  if (elements.menuBtn) {
    elements.menuBtn.addEventListener('click', () => {
      elements.nav.classList.toggle('active');
    });
  }
  
  // Открытие избранного
  if (elements.favoritesBtn) {
    elements.favoritesBtn.addEventListener('click', () => {
      elements.favoritesDrawer.classList.add('active');
      renderFavorites();
    });
  }
  
  // Закрытие избранного
  if (elements.closeFavorites) {
    elements.closeFavorites.addEventListener('click', () => {
      elements.favoritesDrawer.classList.remove('active');
    });
  }
  
  // Фильтрация категорий в каталоге
  if (elements.categoryFilter) {
    elements.categoryFilter.addEventListener('change', (e) => {
      state.currentCategory = e.target.value;
      state.currentPage = 1;
      renderProducts();
    });
  }
  
  // Сортировка товаров
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', () => {
      state.currentPage = 1;
      renderProducts();
    });
  }
  
  // Поиск товаров
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.toLowerCase();
      state.currentPage = 1;
      renderProducts();
    });
  }
  
  // Обработчики событий для динамических элементов
  document.addEventListener('click', (e) => {
    // Кнопка "В корзину"
    if (e.target.classList.contains('add-to-cart') || 
        e.target.closest('.add-to-cart')) {
      const btn = e.target.closest('.add-to-cart');
      const productId = btn.dataset.id;
      addToCart(productId);
    }
    
    // Кнопка "В избранное"
    if (e.target.classList.contains('heart-btn') || 
        e.target.closest('.heart-btn')) {
      const btn = e.target.closest('.heart-btn');
      const productId = btn.dataset.id;
      toggleFavorite(productId);
      
      // Обновляем иконку
      const icon = btn.querySelector('i');
      if (state.favorites.includes(productId)) {
        icon.className = 'fas fa-heart';
        btn.classList.add('active');
      } else {
        icon.className = 'far fa-heart';
        btn.classList.remove('active');
      }
    }
    
    // Клик по карточке товара в каталоге (открытие модалки)
    if (e.target.closest('.product-card') && !e.target.closest('.product-actions')) {
      const card = e.target.closest('.product-card');
      const productId = card.querySelector('.add-to-cart').dataset.id;
      renderProductModal(productId);
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
          const selSize  = document.querySelector('.size-option.selected');
          const selColor = document.querySelector('.color-option.selected');
          if (!selSize||!selColor) {
            alert('Выберите размер и цвет');
            return;
          }
          addToCart(
            productId,
            selSize.dataset.size,
            selColor.dataset.color
          );
      elements.cartDrawer.classList.add('active');
      renderCart();
      elements.productModal.classList.remove('active');
    }

    // выбор цвета
    if (e.target.classList.contains('color-option')) {
      document.querySelectorAll('.color-option')
        .forEach(o=>o.classList.remove('selected'));
      e.target.classList.add('selected');
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
    if (e.target.classList.contains('remove-btn') || 
        e.target.closest('.remove-btn')) {
      const btn = e.target.closest('.remove-btn');
      const index = btn.dataset.index;
      state.cart.splice(index, 1);
      updateCartCount();
      renderCart();
    }
    
    // Удаление из избранного
    if (e.target.classList.contains('btn-remove-fav') || 
        e.target.closest('.btn-remove-fav')) {
      const btn = e.target.closest('.btn-remove-fav');
      const id = btn.dataset.id;
      toggleFavorite(id);
      renderFavorites();
      updateFavoritesCount();
    }
    
    // Добавление в корзину из избранного
    if (e.target.classList.contains('add-to-cart-from-fav') || 
        e.target.closest('.add-to-cart-from-fav')) {
      const btn = e.target.closest('.add-to-cart-from-fav');
      const id = btn.dataset.id;
      addToCart(id);
    }
  });

  document.getElementById('color-filter').addEventListener('change', e => {
    state.filterColor = e.target.value;
    state.currentPage = 1;
    renderProducts();
  });
  document.getElementById('size-filter').addEventListener('change', e => {
    state.filterSize = e.target.value;
    state.currentPage = 1;
    renderProducts();
  });
  
}

// Инициализация приложения
// Инициализация приложения
async function init() {
  // 1) Показываем спиннеры, пока грузятся данные
  if (elements.categoriesContainer) {
    elements.categoriesContainer.innerHTML = `
      <div class="data-placeholder">
        <div class="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    `;
  }
  if (elements.productsContainer) {
    elements.productsContainer.innerHTML = `
      <div class="data-placeholder">
        <div class="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    `;
  }

  // 2) Загружаем данные из Google Sheets
  const success = await fetchData();

  if (!success) {
    // Если не удалось — показываем ошибку в обоих контейнерах
    const errorHTML = `
      <div class="data-placeholder">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ошибка загрузки данных</p>
        <button class="btn-primary" onclick="location.reload()">Повторить попытку</button>
      </div>
    `;
    elements.categoriesContainer?.innerHTML = errorHTML;
    elements.productsContainer  ?.innerHTML = errorHTML;
    return;
  }

  // 3) Убираем спиннеры, обновляем счётчики и навешиваем события
  elements.categoriesContainer?.innerHTML = '';
  elements.productsContainer  ?.innerHTML = '';
  updateCartCount();
  updateFavoritesCount();
  setupEventListeners();

  // 4) Если на странице каталога (есть фильтр категорий)…
  if (elements.categoryFilter) {
    // ── удаляем блок с категориями из index.html, чтобы не дублировался
    document.getElementById('categories')?.remove();

    // ── заполняем фильтры и рендерим товары
    populateCategoryFilter();
    populateExtraFilters();
    renderProducts();
  } else {
    // 5) Иначе — главная страница, показываем только категории
    renderCategories();
  }
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', init);


document
    .getElementById('contact-form')
    .addEventListener('submit', function(e) {
      e.preventDefault();
      const name    = document.getElementById('cf-name').value.trim();
      const phone   = document.getElementById('cf-phone').value.trim();
      const email   = document.getElementById('cf-email').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      let text = '*📩 Новая заявка MonnaRosa*%0A%0A';
      text += `*Имя:* ${encodeURIComponent(name)}%0A`;
      text += `*Телефон:* ${encodeURIComponent(phone)}%0A`;
      if (message) text += `%0A*Сообщение:* %0A${encodeURIComponent(message)}%0A`;

      const phoneTo = '77020072268';
      window.open(`https://wa.me/${phoneTo}?text=${text}`, '_blank');
    });