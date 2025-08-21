// 1. Məhsul qiyməti format etmə funksiyası
function formatPrice(price, currency = 'TL') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency === 'TL' ? 'TRY' : currency,
        minimumFractionDigits: 2
    }).format(price);
}

// 2. Səbətə məhsul əlavə etmə
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartUI();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    getTotalPrice() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        const cartTotal = document.querySelector('.cart-total');
        
        if (cartCount) cartCount.textContent = this.getItemCount();
        if (cartTotal) cartTotal.textContent = formatPrice(this.getTotalPrice());
    }
}

// 3. Məhsul axtarış funksiyası
function searchProducts(query, products) {
    const searchTerm = query.toLowerCase().trim();
    
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
}

// 4. Məhsul filtrleme
function filterProducts(products, filters) {
    return products.filter(product => {
        // Qiymət aralığı
        if (filters.minPrice && product.price < filters.minPrice) return false;
        if (filters.maxPrice && product.price > filters.maxPrice) return false;
        
        // Kateqoriya
        if (filters.category && product.category !== filters.category) return false;
        
        // Brend
        if (filters.brand && product.brand !== filters.brand) return false;
        
        // Reytinq
        if (filters.minRating && product.rating < filters.minRating) return false;
        
        // Mövcudluq
        if (filters.inStock && !product.inStock) return false;
        
        return true;
    });
}

// 5. Məhsul sıralama
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'price-low':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sortedProducts.sort((a, b) => b.price - a.price);
        case 'rating':
            return sortedProducts.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'name':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        default:
            return sortedProducts;
    }
}

// 6. Favori məhsullar
class FavoriteManager {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    }

    addToFavorites(productId) {
        if (!this.favorites.includes(productId)) {
            this.favorites.push(productId);
            this.saveFavorites();
        }
    }

    removeFromFavorites(productId) {
        this.favorites = this.favorites.filter(id => id !== productId);
        this.saveFavorites();
    }

    isFavorite(productId) {
        return this.favorites.includes(productId);
    }

    toggleFavorite(productId) {
        if (this.isFavorite(productId)) {
            this.removeFromFavorites(productId);
        } else {
            this.addToFavorites(productId);
        }
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
}

// 7. İstifadəçi bildirişləri
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// 8. Şəkil lazy loading
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 9. API sorğuları
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products?${queryString}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }
}

// 10. İstifadə nümunələri
document.addEventListener('DOMContentLoaded', function() {
    // Səbət meneceri
    const cart = new ShoppingCart();
    
    // Favori menecer
    const favorites = new FavoriteManager();
    
    // API client
    const api = new ApiClient('/api');
    
    // Lazy loading başlat
    initLazyLoading();
    
    // Səbətə əlavə etmə düymələri
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productData = JSON.parse(this.dataset.product);
            cart.addItem(productData);
            showNotification('Məhsul səbətə əlavə edildi!', 'success');
        });
    });
    
    // Favori düymələri
    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            favorites.toggleFavorite(productId);
            
            this.classList.toggle('active');
            const message = favorites.isFavorite(productId) 
                ? 'Favorilərə əlavə edildi!' 
                : 'Favorilərdən çıxarıldı!';
            showNotification(message, 'info');
        });
    });
    
    // Axtarış
    const searchInput = document.querySelector('#search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value;
                if (query.length >= 3) {
                    // Axtarış et
                    performSearch(query);
                }
            }, 300);
        });
    }
});

// Axtarış funksiyası
async function performSearch(query) {
    try {
        const api = new ApiClient('/api');
        const results = await api.getProducts({ search: query });
        displaySearchResults(results);
    } catch (error) {
        showNotification('Axtarış xətası baş verdi!', 'error');
    }
}

// Axtarış nəticələrini göstər
function displaySearchResults(products) {
    const resultsContainer = document.querySelector('#search-results');
    if (!resultsContainer) return;
    
    if (products.length === 0) {
        resultsContainer.innerHTML = '<p>Heç bir məhsul tapılmadı.</p>';
        return;
    }
    
    const productsHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p class="price">${formatPrice(product.price)}</p>
            <button class="add-to-cart" data-product='${JSON.stringify(product)}'>
                Səbətə əlavə et
            </button>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = productsHTML;
}