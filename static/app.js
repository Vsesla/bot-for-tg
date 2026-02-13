const products = [
  { slug: "longjing", name: "Лунцзин Преміум", category: "Зелений", price: 790, weight: "100 г", description: "Свіжий і горіховий профіль.", image: "https://images.unsplash.com/photo-1597484661976-4f8ce34f32f6?auto=format&fit=crop&w=900&q=80" },
  { slug: "tieguanyin", name: "Те Гуань Інь", category: "Улун", price: 690, weight: "100 г", description: "Квітковий аромат орхідеї.", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80" },
  { slug: "dahongpao", name: "Да Хун Пао", category: "Улун", price: 970, weight: "100 г", description: "Скельний улун з карамельними нотами.", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80" },
  { slug: "shupuer", name: "Шу Пуер 2018", category: "Пуер", price: 840, weight: "100 г", description: "Ноти какао і сухофруктів.", image: "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=900&q=80" },
  { slug: "baimudan", name: "Бай Му Дань", category: "Білий", price: 620, weight: "100 г", description: "Квітково-медовий аромат.", image: "https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=900&q=80" }
];

const state = {
  cart: JSON.parse(localStorage.getItem("teaCart") || "{}")
};

const cartCountEl = document.getElementById("cart-count");
const productsGrid = document.getElementById("products-grid");
const categorySelect = document.getElementById("category-select");
const searchInput = document.getElementById("search-input");
const cartContent = document.getElementById("cart-content");
const checkoutForm = document.getElementById("checkout-form");
const checkoutMessage = document.getElementById("checkout-message");

function saveCart() {
  localStorage.setItem("teaCart", JSON.stringify(state.cart));
}

function cartTotalItems() {
  return Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
}

function cartTotalPrice() {
  return Object.entries(state.cart).reduce((sum, [slug, qty]) => {
    const product = products.find((item) => item.slug === slug);
    return product ? sum + product.price * qty : sum;
  }, 0);
}

function renderCategories() {
  const categories = ["Усі", ...new Set(products.map((item) => item.category))];
  categorySelect.innerHTML = categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function renderProducts() {
  const term = searchInput.value.toLowerCase().trim();
  const category = categorySelect.value;

  const filtered = products.filter((item) => {
    const byTerm = item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
    const byCategory = category === "Усі" || !category || item.category === category;
    return byTerm && byCategory;
  });

  productsGrid.innerHTML = filtered.map((product) => `
    <article class="card">
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${product.category} · ${product.weight}</p>
      <p>${product.description}</p>
      <div class="row">
        <strong>${product.price} грн</strong>
        <button onclick="addToCart('${product.slug}')">У кошик</button>
      </div>
    </article>
  `).join("");
}

function addToCart(slug) {
  state.cart[slug] = (state.cart[slug] || 0) + 1;
  saveCart();
  renderCart();
}

function changeQty(slug, delta) {
  const next = (state.cart[slug] || 0) + delta;
  if (next <= 0) {
    delete state.cart[slug];
  } else {
    state.cart[slug] = next;
  }
  saveCart();
  renderCart();
}

function renderCart() {
  cartCountEl.textContent = `(${cartTotalItems()})`;
  const entries = Object.entries(state.cart);

  if (!entries.length) {
    cartContent.innerHTML = "<p>Кошик порожній.</p>";
    return;
  }

  const rows = entries.map(([slug, qty]) => {
    const product = products.find((item) => item.slug === slug);
    if (!product) return "";
    return `
      <tr>
        <td>${product.name}</td>
        <td>${qty}</td>
        <td>${product.price * qty} грн</td>
        <td>
          <button onclick="changeQty('${slug}', -1)">−</button>
          <button onclick="changeQty('${slug}', 1)">+</button>
        </td>
      </tr>
    `;
  }).join("");

  cartContent.innerHTML = `
    <table>
      <tr><th>Товар</th><th>К-сть</th><th>Сума</th><th>Дії</th></tr>
      ${rows}
    </table>
    <h3>Разом: ${cartTotalPrice()} грн</h3>
  `;
}

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!cartTotalItems()) {
    checkoutMessage.innerHTML = "<p class='alert error'>Додайте товари в кошик перед оформленням.</p>";
    return;
  }

  const form = new FormData(checkoutForm);
  const order = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    customerName: form.get("customerName"),
    phone: form.get("phone"),
    city: form.get("city"),
    address: form.get("address"),
    payment: form.get("payment"),
    comment: form.get("comment"),
    items: state.cart,
    total: cartTotalPrice()
  };

  const history = JSON.parse(localStorage.getItem("teaOrders") || "[]");
  history.push(order);
  localStorage.setItem("teaOrders", JSON.stringify(history));

  state.cart = {};
  saveCart();
  renderCart();
  checkoutForm.reset();
  checkoutMessage.innerHTML = `<p class='alert success'>Замовлення #${order.id} прийнято. Сума: ${order.total} грн.</p>`;
});

renderCategories();
renderProducts();
renderCart();
searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);
