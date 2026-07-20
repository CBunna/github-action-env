document.addEventListener('DOMContentLoaded', () => {
    const healthBadge = document.getElementById('health-badge');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const productForm = document.getElementById('product-form');
    const productsGrid = document.getElementById('products-grid');
    const btnRefresh = document.getElementById('btn-refresh');
    const activePort = document.getElementById('active-port');

    // Display the current active port in the footer
    activePort.textContent = window.location.port || '80';

    // 1. Check Database Health
    async function checkHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (response.ok && data.status === 'UP') {
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Database: Connected';
                healthBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            } else {
                throw new Error(data.error || 'Server reported DOWN state');
            }
        } catch (error) {
            statusIndicator.className = 'status-indicator failed';
            statusText.textContent = 'Database: Disconnected';
            healthBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            console.error('Health check failed:', error);
        }
    }

    // 2. Fetch and Render Products
    async function loadProducts() {
        productsGrid.innerHTML = '<div class="loading-state">Loading products from database...</div>';
        
        try {
            const response = await fetch('/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const products = await response.json();
            
            if (products.length === 0) {
                productsGrid.innerHTML = `
                    <div class="empty-state">
                        <p>No products stored yet.</p>
                        <p style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.7;">Submit the form on the left to add your first product!</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = '';
            products.forEach(product => {
                const dateStr = product.createdAt 
                    ? new Date(product.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                    : 'N/A';

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <h3 class="product-name">${escapeHTML(product.name)}</h3>
                    <div class="product-price">$${Number(product.price).toFixed(2)}</div>
                    <div class="product-date">Created: ${dateStr}</div>
                `;
                productsGrid.appendChild(productCard);
            });
        } catch (error) {
            productsGrid.innerHTML = `
                <div class="empty-state" style="color: var(--accent-red); border-color: rgba(239, 68, 68, 0.3);">
                    <p>Error loading products</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-secondary);">${error.message}</p>
                </div>
            `;
            console.error('Failed to load products:', error);
        }
    }

    // 3. Handle Product Form Submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('name');
        const priceInput = document.getElementById('price');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);

        if (!name || isNaN(price)) return;

        const btn = productForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Saving...</span>';

        try {
            const response = await fetch('/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, price })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save product');
            }

            // Clear form inputs
            nameInput.value = '';
            priceInput.value = '';
            
            // Reload list and check connection status
            await checkHealth();
            await loadProducts();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // Helper: Escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Refresh button listener
    btnRefresh.addEventListener('click', () => {
        checkHealth();
        loadProducts();
    });

    // Initial load
    checkHealth();
    loadProducts();

    // Check health every 15 seconds
    setInterval(checkHealth, 15000);
});
