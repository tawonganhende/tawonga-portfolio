const products = [
    { id: "dew-serum", name: "Dew Drop Face Serum", detail: "Skincare · 30 ml", category: "Skincare", price: 18, tag: "Bestseller", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80", alt: "Skincare serum bottle on a warm neutral background" },
    { id: "daily-cleanser", name: "Soft Start Cleanser", detail: "Skincare · 150 ml", category: "Skincare", price: 14, tag: "Everyday fave", image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=80", alt: "Gentle cleanser and skincare essentials" },
    { id: "glow-oil", name: "Golden Hour Face Oil", detail: "Skincare · 30 ml", category: "Skincare", price: 22, tag: "Feel-good glow", image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80", alt: "Golden-toned face oil and skincare" },
    { id: "soft-blush", name: "Petal Soft Blush", detail: "Makeup · Rose tint", category: "Makeup", price: 16, tag: "New", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80", alt: "Makeup palette and beauty products" },
    { id: "lip-tint", name: "The Everyday Lip Tint", detail: "Makeup · Berry nude", category: "Makeup", price: 12, tag: "", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80", alt: "Lipstick in a warm berry shade" },
    { id: "soft-glam", name: "Soft Glam Palette", detail: "Makeup · 9 shades", category: "Makeup", price: 24, tag: "", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80", alt: "Curated makeup essentials" },
    { id: "rose-mist", name: "Rosewater Ritual Mist", detail: "Fragrance · 100 ml", category: "Fragrance", price: 20, tag: "Little luxury", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80", alt: "Elegant perfume bottle" },
    { id: "body-butter", name: "Sunday Skin Body Butter", detail: "Body care · 200 ml", category: "Body care", price: 17, tag: "", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80", alt: "Body care products for a self-care ritual" }
];

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const productGrid = document.querySelector("[data-product-grid]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartFooter = document.querySelector("[data-cart-footer]");
const cartPanel = document.querySelector(".cart-panel");
const cartButton = document.querySelector(".cart-button");
const statusMessage = document.querySelector("[data-store-status]");
const heroTrack = document.querySelector("[data-hero-track]");
const heroPairs = [...document.querySelectorAll("[data-hero-pair]")];
const heroPages = [...document.querySelectorAll("[data-hero-page]")];
const heroCount = document.querySelector("[data-hero-count]");
const posterLightbox = document.querySelector("[data-poster-lightbox]");
const posterPreview = document.querySelector("[data-poster-preview]");
let activePosterButton;
const storageKey = "ruvarashe-shalom-cart-v1";
let cart = loadCart();
let activeFilter = "All";
let activeHeroPair = 0;
let statusTimer;

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(saved)) throw new TypeError("Saved cart is not a list.");
        return saved.reduce((items, item) => {
            const product = products.find((candidate) => candidate.id === item.id);
            const quantity = Number(item.quantity);
            if (product && Number.isInteger(quantity) && quantity > 0) {
                items.push({ id: product.id, quantity: Math.min(quantity, 99) });
            }
            return items;
        }, []);
    } catch (error) {
        console.warn("The saved Ruvarashe Shalom cart could not be read.", error);
        showStatus("Your saved bag couldn't be loaded. You can still shop during this visit.");
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
        console.error("The Ruvarashe Shalom cart could not be saved in this browser.", error);
        showStatus("Your bag is available for this visit, but couldn't be saved in this browser.");
    }
}

function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.classList.add("is-visible");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => statusMessage.classList.remove("is-visible"), 4500);
}

function renderProducts() {
    const visibleProducts = activeFilter === "All"
        ? products
        : products.filter((product) => product.category === activeFilter);
    productGrid.replaceChildren(...visibleProducts.map((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageWrap = document.createElement("div");
        imageWrap.className = "product-image-wrap";
        const image = document.createElement("img");
        image.className = "product-image";
        image.src = product.image;
        image.alt = product.alt;
        image.loading = "lazy";
        imageWrap.append(image);

        if (product.tag) {
            const tag = document.createElement("span");
            tag.className = "product-tag";
            tag.textContent = product.tag;
            imageWrap.append(tag);
        }

        const addButton = document.createElement("button");
        addButton.className = "add-to-cart";
        addButton.type = "button";
        addButton.dataset.addToCart = product.id;
        addButton.textContent = "Add to bag";
        imageWrap.append(addButton);

        const info = document.createElement("div");
        info.className = "product-info";
        const details = document.createElement("div");
        const name = document.createElement("h3");
        name.textContent = product.name;
        const detail = document.createElement("p");
        detail.textContent = product.detail;
        details.append(name, detail);

        const price = document.createElement("span");
        price.className = "product-price";
        price.textContent = currency.format(product.price);
        info.append(details, price);
        card.append(imageWrap, info);
        return card;
    }));
    document.querySelector("[data-product-count]").textContent =
        `${visibleProducts.length} ${visibleProducts.length === 1 ? "lovely find" : "lovely finds"} · Prices in USD`;
}

function renderCart() {
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => {
        const product = products.find((candidate) => candidate.id === item.id);
        return sum + product.price * item.quantity;
    }, 0);

    document.querySelector(".cart-count").textContent = String(itemCount);
    document.querySelector("[data-cart-heading-count]").textContent = `(${itemCount})`;
    cartButton.setAttribute("aria-label", `Open shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`);
    document.querySelector("[data-cart-total]").textContent = currency.format(total);
    cartItems.replaceChildren(...cart.map((item) => {
        const product = products.find((candidate) => candidate.id === item.id);
        const row = document.createElement("article");
        row.className = "cart-item";
        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.alt;

        const info = document.createElement("div");
        info.className = "cart-item-info";
        const name = document.createElement("h3");
        name.textContent = product.name;
        const price = document.createElement("span");
        price.textContent = currency.format(product.price);
        const quantity = document.createElement("div");
        quantity.className = "quantity-control";

        const decrement = document.createElement("button");
        decrement.type = "button";
        decrement.dataset.cartAction = "decrease";
        decrement.dataset.productId = product.id;
        decrement.setAttribute("aria-label", `Remove one ${product.name}`);
        decrement.textContent = "−";
        const count = document.createElement("span");
        count.textContent = String(item.quantity);
        const increment = document.createElement("button");
        increment.type = "button";
        increment.dataset.cartAction = "increase";
        increment.dataset.productId = product.id;
        increment.setAttribute("aria-label", `Add one ${product.name}`);
        increment.textContent = "+";
        quantity.append(decrement, count, increment);
        info.append(name, price, quantity);

        const remove = document.createElement("button");
        remove.className = "remove-item";
        remove.type = "button";
        remove.dataset.cartAction = "remove";
        remove.dataset.productId = product.id;
        remove.textContent = "Remove";
        row.append(image, info, remove);
        return row;
    }));

    const isEmpty = itemCount === 0;
    cartEmpty.classList.toggle("is-visible", isEmpty);
    cartFooter.classList.toggle("is-hidden", isEmpty);
}

function openCart() {
    document.body.classList.add("cart-open");
    cartPanel.setAttribute("aria-hidden", "false");
    cartButton.setAttribute("aria-expanded", "true");
    cartPanel.querySelector(".close-cart").focus();
}

function closeCart() {
    document.body.classList.remove("cart-open");
    cartPanel.setAttribute("aria-hidden", "true");
    cartButton.setAttribute("aria-expanded", "false");
    cartButton.focus();
}

function showHeroPair(index) {
    activeHeroPair = (index + heroPairs.length) % heroPairs.length;
    heroTrack.style.transform = `translateX(-${activeHeroPair * 100}%)`;
    heroPairs.forEach((pair, pairIndex) => {
        pair.setAttribute("aria-hidden", String(pairIndex !== activeHeroPair));
    });
    heroPages.forEach((page, pageIndex) => {
        const isActive = pageIndex === activeHeroPair;
        page.classList.toggle("is-active", isActive);
        page.setAttribute("aria-pressed", String(isActive));
    });
    heroCount.textContent = `${String(activeHeroPair + 1).padStart(2, "0")} / ${String(heroPairs.length).padStart(2, "0")}`;
}

document.querySelector("[data-hero-previous]").addEventListener("click", () => {
    showHeroPair(activeHeroPair - 1);
});
document.querySelector("[data-hero-next]").addEventListener("click", () => {
    showHeroPair(activeHeroPair + 1);
});
heroPages.forEach((page) => {
    page.addEventListener("click", () => showHeroPair(Number(page.dataset.heroPage)));
});

document.querySelectorAll("[data-poster-open]").forEach((button) => {
    button.addEventListener("click", () => {
        const poster = button.querySelector(".hero-poster");
        activePosterButton = button;
        posterPreview.src = poster.currentSrc || poster.src;
        posterPreview.alt = button.getAttribute("aria-label") || "";
        posterLightbox.showModal();
    });
});
document.querySelector("[data-poster-close]").addEventListener("click", () => posterLightbox.close());
posterLightbox.addEventListener("click", (event) => {
    if (event.target === posterLightbox) posterLightbox.close();
});
posterLightbox.addEventListener("close", () => {
    posterPreview.removeAttribute("src");
    activePosterButton?.focus();
    activePosterButton = null;
});

document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((filterButton) => {
            const selected = filterButton === button;
            filterButton.classList.toggle("is-active", selected);
            filterButton.setAttribute("aria-pressed", String(selected));
        });
        renderProducts();
    });
});

document.querySelectorAll("[data-category-link]").forEach((link) => {
    link.addEventListener("click", () => {
        const filter = link.dataset.categoryLink;
        const filterButton = document.querySelector(`[data-filter="${filter}"]`);
        if (filterButton) filterButton.click();
    });
});

productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;
    const product = products.find((item) => item.id === button.dataset.addToCart);
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 99);
    else cart.push({ id: product.id, quantity: 1 });
    saveCart();
    renderCart();
    showStatus(`${product.name} added to your bag.`);
});

cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const item = cart.find((entry) => entry.id === button.dataset.productId);
    if (!item) return;
    if (button.dataset.cartAction === "increase") item.quantity = Math.min(item.quantity + 1, 99);
    if (button.dataset.cartAction === "decrease") item.quantity -= 1;
    if (button.dataset.cartAction === "remove" || item.quantity <= 0) {
        cart = cart.filter((entry) => entry.id !== item.id);
    }
    saveCart();
    renderCart();
});

cartButton.addEventListener("click", openCart);
document.querySelector(".close-cart").addEventListener("click", closeCart);
document.querySelector("[data-cart-backdrop]").addEventListener("click", closeCart);
document.querySelector("[data-continue-shopping]").addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("cart-open")) return;
    if (event.key === "Escape") {
        closeCart();
        return;
    }
    if (event.key === "Tab") {
        const focusable = [...cartPanel.querySelectorAll("button:not(:disabled), a[href]")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

document.querySelector("[data-current-year]").textContent = String(new Date().getFullYear());
renderProducts();
renderCart();
