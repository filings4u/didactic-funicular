/* ============================================================
   SCREENINGS4U — EMPLOYER SERVICE CATALOG
   employer-catalog.js

   IMPORTANT BUSINESS FLOW:
   - Employers may purchase services directly.
   - Employers may purchase training courses directly.
   - Employer training credits can also be supported as a separate
     purchasable catalog item/package.
   - Final checkout should occur through the central secure checkout flow.

   Database integration targets currently identified:
   - catalog_products
   - catalog_prices
   - global_prices
   - orders
   - order_items
   - payments
   - lms_courses
   ============================================================ */

(function () {
  "use strict";

  const state = {
    products: [],
    cart: [],
    category: "all"
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    loadCatalog();
  }

  function bindEvents() {
    document.querySelectorAll(".catalog-category").forEach(function (button) {
      button.addEventListener("click", function () {
        state.category = button.dataset.category || "all";
        document.querySelectorAll(".catalog-category").forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        renderCatalog();
      });
    });

    document.getElementById("catalog-search")?.addEventListener("input", renderCatalog);
    document.getElementById("catalog-sort")?.addEventListener("change", renderCatalog);

    document.getElementById("catalog-cart-button")?.addEventListener("click", openCart);
    document.getElementById("catalog-close-cart")?.addEventListener("click", closeCart);
    document.getElementById("catalog-cart-overlay")?.addEventListener("click", closeCart);

    document.getElementById("catalog-checkout-button")?.addEventListener("click", beginCheckout);

    document.getElementById("catalog-request-help")?.addEventListener("click", function () {
      alert("The employer assistance request workflow will be connected here.");
    });

    document.querySelectorAll("[data-close-catalog-modal]").forEach(function (button) {
      button.addEventListener("click", closeServiceModal);
    });
  }

  async function loadCatalog() {
    /*
      LIVE SUPABASE IMPLEMENTATION SHOULD:

      1. Resolve authenticated employer.
      2. Query active catalog products and prices.
      3. Include training course metadata when a product links to
         products.training_course_id -> lms_courses.id.
      4. Only expose products intended for employer purchase.

      Suggested normalized client object:
      {
        id,
        name,
        description,
        category,
        price,
        price_note,
        featured,
        training_course_id,
        type
      }

      The existing schema contains BOTH products/catalog tables.
      Since the product architecture is being consolidated, this page
      intentionally does not hard-code a destructive assumption.
      Wire the final query only after the catalog source of truth is chosen.
    */

    state.products = [];
    renderCatalog();
  }

  function getFilteredProducts() {
    const search = String(document.getElementById("catalog-search")?.value || "")
      .trim().toLowerCase();
    const sort = document.getElementById("catalog-sort")?.value || "featured";

    let products = state.products.filter(function (product) {
      const categoryMatch = state.category === "all" ||
        normalizeCategory(product.category) === state.category;

      const haystack = [
        product.name,
        product.description,
        product.category
      ].join(" ").toLowerCase();

      return categoryMatch && (!search || haystack.includes(search));
    });

    products.sort(function (a, b) {
      if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sort === "price-low") return numericPrice(a) - numericPrice(b);
      if (sort === "price-high") return numericPrice(b) - numericPrice(a);

      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

    return products;
  }

  function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    const title = document.getElementById("catalog-section-title");
    const count = document.getElementById("catalog-result-count");
    if (!grid) return;

    const products = getFilteredProducts();
    if (title) title.textContent = categoryTitle(state.category);
    if (count) count.textContent = products.length + (products.length === 1 ? " service" : " services");

    if (!products.length) {
      const hasProducts = state.products.length > 0;

      grid.innerHTML = `
        <div class="catalog-empty">
          <div class="catalog-empty-icon">+</div>
          <h3>${hasProducts ? "No services found" : "Services will appear here"}</h3>
          <p>${hasProducts
            ? "Try a different search or category."
            : "Connect this page to the approved catalog source to display employer services and training."}</p>
        </div>`;
      return;
    }

    grid.innerHTML = products.map(function (product) {
      return `
        <article class="catalog-card">
          <div class="catalog-card-top">
            <span class="catalog-card-category">${escapeHtml(categoryTitle(normalizeCategory(product.category)))}</span>
          </div>
          <div class="catalog-card-body">
            <h3>${escapeHtml(product.name || "Service")}</h3>
            <p>${escapeHtml(product.description || "Service details will be available during checkout.")}</p>
            <div class="catalog-card-bottom">
              <div class="catalog-price">
                ${escapeHtml(formatPrice(product.price))}
                <span class="catalog-price-note">${escapeHtml(product.price_note || "Per service")}</span>
              </div>
              <div class="catalog-card-actions">
                <button class="catalog-details-btn" data-product-details="${escapeAttribute(product.id)}" type="button">Details</button>
                <button class="catalog-add-btn" data-product-add="${escapeAttribute(product.id)}" type="button">Add</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll("[data-product-details]").forEach(function (button) {
      button.addEventListener("click", function () {
        openServiceModal(button.dataset.productDetails);
      });
    });

    grid.querySelectorAll("[data-product-add]").forEach(function (button) {
      button.addEventListener("click", function () {
        addToCart(button.dataset.productAdd);
      });
    });
  }

  function addToCart(productId) {
    const product = state.products.find(function (item) {
      return String(item.id) === String(productId);
    });
    if (!product) return;

    /*
      Services are intentionally stored as separate cart lines.
      Quantity handling can later be enabled only for products where
      multiple quantities make business sense.
    */
    state.cart.push({
      cart_id: createCartId(),
      product_id: product.id,
      name: product.name,
      price: numericPrice(product),
      price_note: product.price_note || "",
      training_course_id: product.training_course_id || null,
      type: product.type || null
    });

    renderCart();
    openCart();
  }

  function removeFromCart(cartId) {
    state.cart = state.cart.filter(function (item) {
      return item.cart_id !== cartId;
    });
    renderCart();
  }

  function renderCart() {
    const items = document.getElementById("catalog-cart-items");
    const total = document.getElementById("catalog-cart-total");
    const badge = document.getElementById("catalog-cart-count");

    if (badge) badge.textContent = state.cart.length;

    const amount = state.cart.reduce(function (sum, item) {
      return sum + Number(item.price || 0);
    }, 0);

    if (total) total.textContent = formatPrice(amount);

    if (!items) return;

    if (!state.cart.length) {
      items.innerHTML = `<div class="catalog-cart-empty">Your cart is empty.</div>`;
      return;
    }

    items.innerHTML = state.cart.map(function (item) {
      return `
        <div class="catalog-cart-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span class="catalog-cart-item-price">${escapeHtml(formatPrice(item.price))}</span>
          </div>
          <button class="catalog-remove-btn" data-cart-remove="${escapeAttribute(item.cart_id)}" type="button">Remove</button>
        </div>`;
    }).join("");

    items.querySelectorAll("[data-cart-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        removeFromCart(button.dataset.cartRemove);
      });
    });
  }

  function openCart() {
    document.getElementById("catalog-cart-drawer")?.classList.add("is-open");
    document.getElementById("catalog-cart-overlay")?.classList.add("is-open");
    document.getElementById("catalog-cart-drawer")?.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    document.getElementById("catalog-cart-drawer")?.classList.remove("is-open");
    document.getElementById("catalog-cart-overlay")?.classList.remove("is-open");
    document.getElementById("catalog-cart-drawer")?.setAttribute("aria-hidden", "true");
  }

  function openServiceModal(productId) {
    const product = state.products.find(function (item) {
      return String(item.id) === String(productId);
    });
    if (!product) return;

    const modal = document.getElementById("catalog-service-modal");
    const content = document.getElementById("catalog-modal-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <span class="catalog-modal-category">${escapeHtml(categoryTitle(normalizeCategory(product.category)))}</span>
      <h2>${escapeHtml(product.name || "Service")}</h2>
      <p class="catalog-modal-description">${escapeHtml(product.description || "Additional service information will be provided during the purchase process.")}</p>

      <div class="catalog-modal-meta">
        <div><span>Starting Price</span><strong>${escapeHtml(formatPrice(product.price))}</strong></div>
        <div><span>Purchase Type</span><strong>${escapeHtml(product.type || "Service")}</strong></div>
      </div>

      <div class="catalog-modal-actions">
        <button class="catalog-details-btn" data-close-catalog-modal type="button">Close</button>
        <button class="catalog-add-btn" id="catalog-modal-add" type="button">Add to Cart</button>
      </div>`;

    content.querySelector("[data-close-catalog-modal]")?.addEventListener("click", closeServiceModal);
    content.querySelector("#catalog-modal-add")?.addEventListener("click", function () {
      addToCart(product.id);
      closeServiceModal();
    });

    modal.hidden = false;
  }

  function closeServiceModal() {
    const modal = document.getElementById("catalog-service-modal");
    if (modal) modal.hidden = true;
  }

  function beginCheckout() {
    if (!state.cart.length) {
      alert("Your cart is empty.");
      return;
    }

    /*
      FINAL CHECKOUT FLOW:

      1. Send cart to a secure server/Edge Function.
      2. Validate current prices server-side.
      3. Create orders record.
      4. Create order_items.
      5. Create Stripe Checkout Session or Payment Intent.
      6. On verified webhook:
         - record payment
         - mark order paid
         - create LMS enrollments for direct training purchases
         - add employer training credits when a credit package was purchased
      7. Redirect employer back to the order confirmation page.

      Do NOT create paid orders or enrollments from the browser before
      server-side payment verification.
    */

    alert("The secure checkout workflow will be connected to this cart.");
  }

  function normalizeCategory(value) {
    return String(value || "workplace-services")
      .toLowerCase().trim()
      .replace(/_/g, "-").replace(/\s+/g, "-");
  }

  function categoryTitle(category) {
    const labels = {
      all: "All Services",
      "drug-testing": "Drug Testing",
      "alcohol-testing": "Alcohol Testing",
      "background-checks": "Background Checks",
      "dot-services": "DOT Services",
      training: "Training",
      "workplace-services": "Workplace Services"
    };
    return labels[category] || "Services";
  }

  function numericPrice(product) {
    return Number(product?.price || product?.amount || 0);
  }

  function formatPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Contact Us";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(number);
  }

  function createCartId() {
    return "cart-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
