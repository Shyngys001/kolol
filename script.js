 
//  // Состояние приложения
//  const state = {
//   categories: [],
//   products: [],
//   cart: JSON.parse(localStorage.getItem('cart')) || [],
//   favorites: JSON.parse(localStorage.getItem('favorites')) || [],
//   currentCategory: 'all',
//   currentProduct: null,
//   searchTerm: ''
// };

// // Ссылки на DOM-элементы
// const elements = {
//   categoriesContainer: document.getElementById('categories-container'),
//   productsContainer: document.getElementById('products-container'),
//   cartBtn: document.getElementById('cart-btn'),
//   cartDrawer: document.getElementById('cart-drawer'),
//   closeCart: document.getElementById('close-cart'),
//   cartItems: document.getElementById('cart-items'),
//   cartTotal: document.getElementById('cart-total'),
//   cartCount: document.getElementById('cart-count'),
//   favoritesBtn: document.getElementById('favorites-btn'),
//   favoritesCount: document.getElementById('favorites-count'),
//   checkoutBtn: document.getElementById('checkout-btn'),
//   productModal: document.getElementById('product-modal'),
//   modalBody: document.getElementById('modal-body'),
//   modalClose: document.querySelector('.modal-close'),
//   sortSelect: document.getElementById('sort'),
//   menuBtn: document.getElementById('menu-btn'),
//   nav: document.querySelector('nav'),
//   categoryFilter: document.getElementById('category-filter'),
//   searchInput: document.getElementById('search-input'),
//   favoritesDrawer: document.getElementById('favorites-drawer'),
//   favoritesItems: document.getElementById('favorites-items'),
//   closeFavorites: document.getElementById('close-favorites'),
// };

// // Преобразуем Drive-ссылку в прямую картинку
// function normalizeDriveUrl(url) {
//   if (!url) return '';
  
//   // Обрабатываем все форматы ссылок Google Drive
//   const patterns = [
//       /\/d\/([a-zA-Z0-9_-]+)/,
//       /\/file\/d\/([a-zA-Z0-9_-]+)/,
//       /id=([a-zA-Z0-9_-]+)/,
//       /[a-zA-Z0-9_-]{25,}/  // Ищем длинные ID напрямую
//   ];
  
//   let id = null;
//   for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match && match[1]) {
//           id = match[1];
//           break;
//       }
//   }
  
//   // Если нашли ID - формируем прямую ссылку на изображение
//   return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
// }

// // Загрузка и нормализация данных из Google Sheets
// async function fetchData() {
//   try {
//       // Категории
//       const catRes = await fetch(
//           'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Категории&tqx=out:json'
//       );
//       const catText = await catRes.text();
//       const catJson = JSON.parse(catText.substring(47, catText.length-2));
//       const catRows = catJson.table.rows;
      
//       state.categories = catRows.map(row => {
//           const obj = {};
//           row.c.forEach((cell, i) => {
//               if (cell) obj[catJson.table.cols[i].label] = cell.v;
//           });
//           return {
//               id: obj.id || '',
//               name: obj['название'] || 'Категория',
//               image: normalizeDriveUrl(obj['URL-картинки']) || 'https://via.placeholder.com/400'
//           };
//       });

//       // Товары
//       const prodRes = await fetch(
//           'https://docs.google.com/spreadsheets/d/16i14DP8NKNh2O62IeNZvN7LS95uuFG01vzboS0p_51o/gviz/tq?sheet=Товары&tqx=out:json'
//       );
//       const prodText = await prodRes.text();
//       const prodJson = JSON.parse(prodText.substring(47, prodText.length-2));
//       const prodRows = prodJson.table.rows;
      
//       state.products = prodRows.map(row => {
//           const obj = {};
//           row.c.forEach((cell, i) => {
//               if (cell) obj[prodJson.table.cols[i].label] = cell.v;
//           });
//           return {
//               id: obj.id || '',
//               name: obj.name || 'Товар',
//               category_id: obj.category_id || '',
//               description: obj.description || 'Описание отсутствует',
//               price: obj.price ? parseFloat(obj.price) : 0,
//               old_price: obj.old_price ? parseFloat(obj.old_price) : 0,
//               image1: normalizeDriveUrl(obj.image_url1) || 'https://via.placeholder.com/400',
//               image2: normalizeDriveUrl(obj.image_url2) || '',
//               image3: normalizeDriveUrl(obj.image_url3) || ''
//           };
//       });
      
//   } catch (err) {
//       console.error('Ошибка загрузки данных:', err);
//       return false;
//   }
//   return true;
// }

// // Рендерим категории на главной странице
// function renderCategories() {
//   if (!state.categories.length) return;
  
//   elements.categoriesContainer.innerHTML = '';
  
//   state.categories.forEach(cat => {
//       const a = document.createElement('a');
//       a.href = `catalog.html?category=${cat.id}`;
//       a.className = 'category-card';
//       a.innerHTML = `
//           <img src="${cat.image}" alt="${cat.name}">
//           <h3>${cat.name}</h3>
//       `;
//       elements.categoriesContainer.appendChild(a);
//   });
// }

// // Обновление счетчика корзины
// function updateCartCount() {
//   const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
//   elements.cartCount.textContent = count;
//   localStorage.setItem('cart', JSON.stringify(state.cart));
// }

// // Обновление счетчика избранного
// function updateFavoritesCount() {
//   elements.favoritesCount.textContent = state.favorites.length;
//   localStorage.setItem('favorites', JSON.stringify(state.favorites));
// }

// // Добавление в корзину
// function addToCart(productId, size = '86') {
//   const product = state.products.find(p => p.id == productId);
//   if (!product) return;
  
//   const existingItemIndex = state.cart.findIndex(
//       item => item.id == productId && item.size == size
//   );
  
//   if (existingItemIndex !== -1) {
//       // Увеличиваем количество существующего товара
//       state.cart[existingItemIndex].quantity += 1;
//   } else {
//       // Добавляем новый товар
//       state.cart.push({
//           id: product.id,
//           name: product.name,
//           price: product.price,
//           image: product.image1,
//           size: size,
//           quantity: 1
//       });
//   }
  
//   updateCartCount();
  
//   // Анимация добавления
//   elements.cartCount.style.transform = 'scale(1.5)';
//   setTimeout(() => {
//       elements.cartCount.style.transform = 'scale(1)';
//   }, 300);
  
//   // Показываем уведомление
//   const notification = document.createElement('div');
//   notification.className = 'notification';
//   notification.innerHTML = `<i class="fas fa-check"></i> Товар добавлен в корзину`;
//   document.body.appendChild(notification);
  
//   setTimeout(() => {
//       notification.classList.add('show');
//   }, 10);
  
//   setTimeout(() => {
//       notification.classList.remove('show');
//       setTimeout(() => {
//           document.body.removeChild(notification);
//       }, 300);
//   }, 2000);
// }

// // Переключение избранного
// function toggleFavorite(productId) {
//   const id = String(productId);
//   const idx = state.favorites.indexOf(id);
//   if (idx > -1) {
//       state.favorites.splice(idx, 1);
//   } else {
//       state.favorites.push(id);
//   }
//   updateFavoritesCount();
// }

// // Оформление заказа через WhatsApp
// function checkout() {
//   if (state.cart.length === 0) return;
  
//   const phone = '77479894879';
//   let message = 'Здравствуйте! Я хочу заказать:%0A%0A';
  
//   state.cart.forEach(item => {
//       message += `- ${item.name} (Размер: ${item.size}) - ${item.quantity} шт. × ${item.price} ₸%0A`;
//   });
  
//   const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   message += `%0AИтого: ${total} ₸%0A%0AСпасибо!`;
  
//   window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
// }

// // Рендер корзины
// function renderCart() {
//   elements.cartItems.innerHTML = '';
  
//   if (state.cart.length === 0) {
//       elements.cartItems.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
//       elements.cartTotal.textContent = '0';
//       return;
//   }
  
//   let total = 0;
  
//   state.cart.forEach((item, index) => {
//       total += item.price * item.quantity;
      
//       const cartItem = document.createElement('div');
//       cartItem.className = 'cart-item';
//       cartItem.innerHTML = `
//           <div class="cart-item-image">
//               <img src="${item.image}" alt="${item.name}">
//           </div>
//           <div class="cart-item-details">
//               <h3 class="cart-item-title">${item.name}</h3>
//               <p class="cart-item-price">${item.price} ₸ × ${item.quantity}</p>
//               <p class="cart-item-size">Размер: ${item.size}</p>
//               <div class="cart-item-actions">
//                   <button class="quantity-btn minus" data-index="${index}">-</button>
//                   <span>${item.quantity}</span>
//                   <button class="quantity-btn plus" data-index="${index}">+</button>
//                   <button class="remove-btn" data-index="${index}">
//                       <i class="fas fa-trash"></i>
//                   </button>
//               </div>
//           </div>
//       `;
//       elements.cartItems.appendChild(cartItem);
//   });
  
//   elements.cartTotal.textContent = total.toLocaleString();
// }

// // Рендер избранного
// function renderFavorites() {
//   elements.favoritesItems.innerHTML = '';
  
//   if (state.favorites.length === 0) {
//       elements.favoritesItems.innerHTML = '<p class="empty-favorites">Список избранного пуст</p>';
//       return;
//   }
  
//   state.favorites.forEach(id => {
//       const product = state.products.find(p => p.id === id);
//       if (!product) return;
      
//       const isFav = state.favorites.includes(product.id);
//       const favItem = document.createElement('div');
//       favItem.className = 'favorite-item';
//       favItem.innerHTML = `
//           <img src="${product.image1}" alt="${product.name}">
//           <div class="favorite-details">
//               <h4>${product.name}</h4>
//               <p>${product.price} ₸</p>
//               <div class="favorite-actions">
//                   <button class="btn-primary add-to-cart-from-fav" data-id="${product.id}">В корзину</button>
//                   <button class="btn-remove-fav" data-id="${product.id}">&times; Убрать</button>
//               </div>
//           </div>
//       `;
//       elements.favoritesItems.appendChild(favItem);
//   });
// }

// // Рендер модального окна товара
// function renderProductModal(productId) {
//   const product = state.products.find(p => p.id == productId);
//   if (!product) return;
  
//   const isFavorite = state.favorites.includes(product.id);
  
//   elements.modalBody.innerHTML = `
//       <div class="modal-images">
//           <div class="modal-main-image">
//               <img src="${product.image1}" alt="${product.name}" id="main-image">
//           </div>
//           <div class="modal-thumbnails">
//               <div class="modal-thumbnail active" data-image="${product.image1}">
//                   <img src="${product.image1}" alt="Thumbnail 1">
//               </div>
//               ${product.image2 ? `
//               <div class="modal-thumbnail" data-image="${product.image2}">
//                   <img src="${product.image2}" alt="Thumbnail 2">
//               </div>
//               ` : ''}
//               ${product.image3 ? `
//               <div class="modal-thumbnail" data-image="${product.image3}">
//                   <img src="${product.image3}" alt="Thumbnail 3">
//               </div>
//               ` : ''}
//           </div>
//       </div>
//       <div class="modal-info">
//           <h2 class="modal-title">${product.name}</h2>
//           <div class="modal-price">
//               <span class="modal-current-price">${product.price} ₸</span>
//               ${product.old_price ? `<span class="modal-old-price">${product.old_price} ₸</span>` : ''}
//           </div>
//           <p class="modal-description">${product.description || 'Премиальное качество для вашего ребенка'}</p>
          
//           <div class="modal-sizes">
//               <h4>Размеры:</h4>
//               <div class="size-options">
//                   ${['XS', 'XXS', 'S', 'M', 'L', 'XL'].map(size => `
//                       <div class="size-option" data-size="${size}">${size}</div>
//                   `).join('')}
//               </div>
//           </div>
          
//           <div class="modal-actions">
//               <button class="heart-btn ${isFavorite ? 'active' : ''}" data-id="${product.id}">
//                   <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
//                   ${isFavorite ? 'В избранном' : 'В избранное'}
//               </button>
//               <button class="btn-primary add-to-cart-modal" data-id="${product.id}">Добавить в корзину</button>
//           </div>
//       </div>
//   `;
  
//   elements.productModal.classList.add('active');
// }

// // Настройка обработчиков событий
// function setupEventListeners() {
//   // Открытие корзины
//   elements.cartBtn.addEventListener('click', () => {
//       elements.cartDrawer.classList.add('active');
//       renderCart();
//   });
  
//   // Закрытие корзины
//   elements.closeCart.addEventListener('click', () => {
//       elements.cartDrawer.classList.remove('active');
//   });
  
//   // Оформление заказа
//   elements.checkoutBtn.addEventListener('click', checkout);
  
//   // Закрытие модального окна
//   elements.modalClose.addEventListener('click', () => {
//       elements.productModal.classList.remove('active');
//   });
  
//   // Клик по фону для закрытия модалки
//   elements.productModal.addEventListener('click', (e) => {
//       if (e.target === elements.productModal) {
//           elements.productModal.classList.remove('active');
//       }
//   });
  
//   // Бургер-меню
//   elements.menuBtn.addEventListener('click', () => {
//       elements.nav.classList.toggle('active');
//   });
  
//   // Открытие избранного
//   elements.favoritesBtn.addEventListener('click', () => {
//       elements.favoritesDrawer.classList.add('active');
//       renderFavorites();
//   });
  
//   // Закрытие избранного
//   elements.closeFavorites.addEventListener('click', () => {
//       elements.favoritesDrawer.classList.remove('active');
//   });
  
//   // Обработчики событий для динамических элементов
//   document.addEventListener('click', (e) => {
//       // Кнопка "В корзину"
//       if (e.target.classList.contains('add-to-cart') || 
//           e.target.closest('.add-to-cart')) {
//           const btn = e.target.closest('.add-to-cart');
//           const productId = btn.dataset.id;
//           addToCart(productId);
//       }
      
//       // Кнопка "В избранное"
//       if (e.target.classList.contains('heart-btn') || 
//           e.target.closest('.heart-btn')) {
//           const btn = e.target.closest('.heart-btn');
//           const productId = btn.dataset.id;
//           toggleFavorite(productId);
          
//           // Обновляем иконку
//           const icon = btn.querySelector('i');
//           if (state.favorites.includes(productId)) {
//               icon.className = 'fas fa-heart';
//               btn.classList.add('active');
//           } else {
//               icon.className = 'far fa-heart';
//               btn.classList.remove('active');
//           }
//       }
      
//       // Миниатюры в модалке
//       if (e.target.closest('.modal-thumbnail')) {
//           const thumbnail = e.target.closest('.modal-thumbnail');
//           const mainImage = document.getElementById('main-image');
//           mainImage.src = thumbnail.dataset.image;
          
//           // Обновление активной миниатюры
//           document.querySelectorAll('.modal-thumbnail').forEach(t => {
//               t.classList.remove('active');
//           });
//           thumbnail.classList.add('active');
//       }
      
//       // Выбор размера
//       if (e.target.classList.contains('size-option')) {
//           const sizeOption = e.target;
          
//           // Обновление активного размера
//           document.querySelectorAll('.size-option').forEach(option => {
//               option.classList.remove('selected');
//           });
//           sizeOption.classList.add('selected');
//       }
      
//       // Кнопка "Добавить в корзину" в модалке
//       if (e.target.classList.contains('add-to-cart-modal')) {
//           const btn = e.target;
//           const productId = btn.dataset.id;
//           const selectedSize = document.querySelector('.size-option.selected');
          
//           if (!selectedSize) {
//               alert('Пожалуйста, выберите размер');
//               return;
//           }
          
//           addToCart(productId, selectedSize.dataset.size);
//           elements.cartDrawer.classList.add('active');
//           renderCart();
//           elements.productModal.classList.remove('active');
//       }
      
//       // Управление количеством в корзине
//       if (e.target.classList.contains('quantity-btn')) {
//           const btn = e.target;
//           const index = btn.dataset.index;
          
//           if (btn.classList.contains('plus')) {
//               state.cart[index].quantity += 1;
//           } else if (btn.classList.contains('minus')) {
//               if (state.cart[index].quantity > 1) {
//                   state.cart[index].quantity -= 1;
//               } else {
//                   state.cart.splice(index, 1);
//               }
//           }
          
//           updateCartCount();
//           renderCart();
//       }
      
//       // Удаление товара из корзины
//       if (e.target.classList.contains('remove-btn') || 
//           e.target.closest('.remove-btn')) {
//           const btn = e.target.closest('.remove-btn');
//           const index = btn.dataset.index;
//           state.cart.splice(index, 1);
//           updateCartCount();
//           renderCart();
//       }
      
//       // Удаление из избранного
//       if (e.target.classList.contains('btn-remove-fav') || 
//           e.target.closest('.btn-remove-fav')) {
//           const btn = e.target.closest('.btn-remove-fav');
//           const id = btn.dataset.id;
//           toggleFavorite(id);
//           renderFavorites();
//           updateFavoritesCount();
//       }
      
//       // Добавление в корзину из избранного
//       if (e.target.classList.contains('add-to-cart-from-fav') || 
//           e.target.closest('.add-to-cart-from-fav')) {
//           const btn = e.target.closest('.add-to-cart-from-fav');
//           const id = btn.dataset.id;
//           addToCart(id);
//       }
//   });
// }

// // Инициализация приложения
// async function init() {
//   // Показать индикатор загрузки
//   elements.categoriesContainer.innerHTML = `
//       <div class="data-placeholder">
//           <div class="loading-spinner"></div>
//           <p>Загрузка данных...</p>
//       </div>
//   `;
  
//   // Загрузка данных
//   const success = await fetchData();
  
//   if (success) {
//       // Обновляем интерфейс
//       renderCategories();
//       updateCartCount();
//       updateFavoritesCount();
//       setupEventListeners();
//   } else {
//       // Показать сообщение об ошибке
//       elements.categoriesContainer.innerHTML = `
//           <div class="data-placeholder">
//               <i class="fas fa-exclamation-triangle"></i>
//               <p>Ошибка загрузки данных</p>
//               <button class="btn-primary" onclick="location.reload()">Повторить попытку</button>
//           </div>
//       `;
//   }
// }

// // Запуск приложения
// document.addEventListener('DOMContentLoaded', init);


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
  nav: document.querySelector('nav'),
  categoryFilter: document.getElementById('category-filter'),
  searchInput: document.getElementById('search-input'),
  favoritesDrawer: document.getElementById('favorites-drawer'),
  favoritesItems: document.getElementById('favorites-items'),
  closeFavorites: document.getElementById('close-favorites'),
};

// Преобразуем Drive-ссылку в прямую картинку
function normalizeDriveUrl(url) {
  if (!url) return '';
  
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
        id: String(obj.id || ''),               // <- явно строка
        name: obj.name || 'Товар',
        category_id: String(obj.category_id || ''), // <- тоже строка
        description: obj.description || 'Описание отсутствует',
        price: obj.price ? parseFloat(obj.price) : 0,
        old_price: obj.old_price ? parseFloat(obj.old_price) : 0,
        image1: normalizeDriveUrl(obj.image_url1) || 'https://via.placeholder.com/400',
        image2: normalizeDriveUrl(obj.image_url2) || '',
        image3: normalizeDriveUrl(obj.image_url3) || ''
      };
    });
    
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    return false;
  }
  return true;
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
  
  // Если нет товаров
  if (items.length === 0) {
    elements.productsContainer.innerHTML = '<p class="no-products">Товары не найдены</p>';
    return;
  }
  
  // Рендер товаров
  items.forEach(p => {
    const isFav = state.favorites.includes(p.id);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${p.image1}" alt="${p.name}">
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
        <button class="heart-btn ${isFav ? 'active' : ''}" data-id="${p.id}">
          <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <button class="btn-primary add-to-cart" data-id="${p.id}">В корзину</button>
      </div>
    `;
    elements.productsContainer.appendChild(card);
  });
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
    state.cart[existingItemIndex].quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image1,
      size: size,
      quantity: 1
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
  
  const phone = '77479894879';
  let message = 'Здравствуйте! Я хочу заказать:%0A%0A';
  
  state.cart.forEach(item => {
    message += `- ${item.name} (Размер: ${item.size}) - ${item.quantity} шт. × ${item.price} ₸%0A`;
  });
  
  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  message += `%0AИтого: ${total} ₸%0A%0AСпасибо!`;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
    
    const isFav = state.favorites.includes(product.id);
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
      renderProducts();
    });
  }
  
  // Сортировка товаров
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', renderProducts);
  }
  
  // Поиск товаров
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.toLowerCase();
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
}

// Инициализация приложения
async function init() {
  // Показать индикатор загрузки
  if (elements.categoriesContainer) {
    elements.categoriesContainer.innerHTML = `
      <div class="data-placeholder">
        <div class="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    `;
  }
  

  
  // Загрузка данных
  const success = await fetchData();
  
  if (success) {
    updateCartCount();
    updateFavoritesCount();
    setupEventListeners();
    
    if (isCatalogPage) {
      // убираем спиннер из categoriesContainer
      elements.categoriesContainer.innerHTML = '';
      
      populateCategoryFilter();
      renderProducts();
    } else {
      renderCategories();
    }
  } else {
    // Показать сообщение об ошибке
    const errorHTML = `
      <div class="data-placeholder">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ошибка загрузки данных</p>
        <button class="btn-primary" onclick="location.reload()">Повторить попытку</button>
      </div>
    `;
    
    if (elements.categoriesContainer) {
      elements.categoriesContainer.innerHTML = errorHTML;
    }
    
    if (elements.productsContainer) {
      elements.productsContainer.innerHTML = errorHTML;
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);