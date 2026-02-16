const KEYS = {
  products: "pv_products",
  users: "pv_users",
  currentUser: "pv_current_user",
  carts: "pv_carts",
  orders: "pv_orders",
};

const defaultProducts = [
  {
    id: "p1",
    name: "PhoneVerse SmartWatch Pro",
    desc: "AMOLED display, Bluetooth calling, health monitor.",
    longDesc: "SmartWatch Pro gives you fitness, notifications, and all-day comfort with premium finish.",
    brand: "PhoneVerse",
    category: "Wearables",
    highlights: ["1.96 inch AMOLED", "Bluetooth calling", "Health & sleep tracking"],
    price: 2999,
    stock: 40,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    name: "Wireless Earbuds X2",
    desc: "ENC mic, deep bass, 30H battery life.",
    longDesc: "Earbuds X2 delivers stable connection, clear calling and powerful bass in compact design.",
    brand: "PhoneVerse",
    category: "Audio",
    highlights: ["ENC mic", "30-hour battery", "Fast pairing"],
    price: 1799,
    stock: 55,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
  },
];

function getJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initData() {
  if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);
  if (!localStorage.getItem(KEYS.users)) setJSON(KEYS.users, []);
  if (!localStorage.getItem(KEYS.carts)) setJSON(KEYS.carts, {});
  if (!localStorage.getItem(KEYS.orders)) setJSON(KEYS.orders, []);
}
initData();

const state = {
  products: getJSON(KEYS.products, []),
  users: getJSON(KEYS.users, []),
  carts: getJSON(KEYS.carts, {}),
  orders: getJSON(KEYS.orders, []),
  currentUser: getJSON(KEYS.currentUser, null),
  currentAddress: null,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const pages = {
  store: $("#storePage"),
  checkout: $("#checkoutPage"),
  orders: $("#ordersPage"),
};

function saveState() {
  setJSON(KEYS.products, state.products);
  setJSON(KEYS.users, state.users);
  setJSON(KEYS.carts, state.carts);
  setJSON(KEYS.orders, state.orders);
  setJSON(KEYS.currentUser, state.currentUser);
}

function userId() {
  return state.currentUser?.email || "guest";
}
function userCart() {
  const id = userId();
  state.carts[id] = state.carts[id] || [];
  return state.carts[id];
}

function showPage(name) {
  Object.values(pages).forEach((p) => p.classList.add("hidden"));
  pages[name].classList.remove("hidden");
}

function updateAuthUi() {
  $("#authBtn").textContent = state.currentUser ? `Sign Out (${state.currentUser.name})` : "Sign In";
}

function ensureAuth() {
  if (state.currentUser) return true;
  $("#authSection").classList.remove("hidden");
  $("#authMsg").textContent = "Please sign in first.";
  return false;
}

function renderProducts() {
  const q = $("#searchInput").value.toLowerCase().trim();
  const grid = $("#productGrid");
  grid.innerHTML = "";

  state.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
    .forEach((p) => {
      const node = $("#productCardTpl").content.firstElementChild.cloneNode(true);
      node.querySelector(".product-image").src = p.image;
      node.querySelector(".product-image").alt = p.name;
      node.querySelector(".product-title").textContent = p.name;
      node.querySelector(".product-desc").textContent = p.desc;
      node.querySelector(".product-price").textContent = p.price;
      node.querySelector(".product-stock").textContent = p.stock;
      const disabled = p.stock <= 0;
      node.querySelectorAll("button").forEach((b) => (b.disabled = disabled));

      node.querySelector(".view-btn").addEventListener("click", () => {
        location.href = `product-detail.html?id=${encodeURIComponent(p.id)}`;
      });

      node.querySelector(".cart-btn").addEventListener("click", () => addToCart(p.id, 1));
      node.querySelector(".buy-btn").addEventListener("click", () => {
        addToCart(p.id, 1);
        showCheckout();
      });
      grid.appendChild(node);
    });
}

function addToCart(productId, qty) {
  const product = state.products.find((p) => p.id === productId);
  if (!product || product.stock < qty) return alert("Out of stock.");
  const cart = userCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    if (existing.qty + qty > product.stock) return alert("Not enough stock.");
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  saveState();
  renderCartCount();
}

function renderCartCount() {
  $("#cartCount").textContent = userCart().reduce((sum, item) => sum + item.qty, 0);
}

function showCheckout() {
  if (!ensureAuth()) return;
  $("#authSection").classList.add("hidden");
  showPage("checkout");
  renderCheckout();
}

function renderCheckout() {
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  const cart = userCart();
  let total = 0;

  if (!cart.length) wrap.innerHTML = "<p>Your cart is empty.</p>";

  cart.forEach((item) => {
    const p = state.products.find((x) => x.id === item.productId);
    if (!p) return;
    const itemTotal = p.price * item.qty;
    total += itemTotal;
    const row = document.createElement("div");
    row.innerHTML = `<span>${p.name} x ${item.qty}</span><strong>₹${itemTotal}</strong>`;
    wrap.appendChild(row);
  });

  $("#cartTotal").textContent = total;
}

function activateTracking(container, status) {
  const flow = ["order", "shipped", "out_for_delivery", "delivered"];
  const index = flow.indexOf(status);
  container.querySelectorAll(".step").forEach((step, i) => {
    step.classList.toggle("active", i <= index);
  });
}

function renderMyOrders() {
  if (!ensureAuth()) return;
  showPage("orders");
  const list = $("#ordersList");
  list.innerHTML = "";

  const myOrders = state.orders.filter((o) => o.userEmail === userId()).slice().reverse();
  if (!myOrders.length) {
    list.innerHTML = `<div class="card"><p>No orders yet.</p></div>`;
    return;
  }

  myOrders.forEach((order) => {
    const card = $("#orderCardTpl").content.firstElementChild.cloneNode(true);
    card.querySelector(".order-id").textContent = `Order ID: ${order.id}`;
    card.querySelector(".order-status").textContent = order.status.replaceAll("_", " ");
    card.querySelector(".order-total").textContent = order.total;
    card.querySelector(".order-items").textContent = order.items.map((i) => `${i.name} x ${i.qty}`).join(" | ");
    activateTracking(card.querySelector(".mini-track"), order.status);
    list.appendChild(card);
  });
}

$("#authBtn").addEventListener("click", () => {
  if (state.currentUser) {
    state.currentUser = null;
    saveState();
    updateAuthUi();
    renderCartCount();
    showPage("store");
    return;
  }
  $("#authSection").classList.toggle("hidden");
  $("#authMsg").textContent = "";
});

$("#goHome").addEventListener("click", () => showPage("store"));
$("#goCheckout").addEventListener("click", showCheckout);
$("#goOrders").addEventListener("click", renderMyOrders);
$("#searchInput").addEventListener("input", renderProducts);

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.remove("active"));
    tab.classList.add("active");
    $("#signinForm").classList.toggle("hidden", tab.dataset.tab !== "signin");
    $("#signupForm").classList.toggle("hidden", tab.dataset.tab !== "signup");
    $("#authMsg").textContent = "";
  });
});

$("#signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const phone = $("#signupPhone").value.trim();
  const password = $("#signupPassword").value;

  if (!name || !email || !phone || !password) {
    $("#authMsg").textContent = "All fields are required.";
    return;
  }
  if (state.users.some((u) => u.email === email)) {
    $("#authMsg").textContent = "Account exists, please sign in.";
    return;
  }

  state.users.push({ name, email, phone, password });
  state.currentUser = { name, email, phone };
  saveState();
  updateAuthUi();
  renderCartCount();
  $("#authSection").classList.add("hidden");
  $("#authMsg").textContent = "";
});

$("#signinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#signinEmail").value.trim().toLowerCase();
  const password = $("#signinPassword").value;

  if (!email || !password) {
    $("#authMsg").textContent = "Email and password required.";
    return;
  }

  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    $("#authMsg").textContent = "Invalid email or password.";
    return;
  }

  state.currentUser = { name: user.name, email: user.email, phone: user.phone };
  saveState();
  updateAuthUi();
  renderCartCount();
  $("#authSection").classList.add("hidden");
  $("#authMsg").textContent = "";
});

$("#addressForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.currentAddress = {
    name: $("#addrName").value.trim(),
    phone: $("#addrPhone").value.trim(),
    line: $("#addrLine").value.trim(),
    city: $("#addrCity").value.trim(),
    state: $("#addrState").value.trim(),
    pincode: $("#addrPincode").value.trim(),
    instruction: $("#addrInstruction").value.trim(),
  };

  const preview = $("#addressPreview");
  preview.innerHTML = `
    <strong>Address Added</strong>
    <p>${state.currentAddress.name} (${state.currentAddress.phone})</p>
    <p>${state.currentAddress.line}, ${state.currentAddress.city}, ${state.currentAddress.state} - ${state.currentAddress.pincode}</p>
    <p>${state.currentAddress.instruction || "No delivery instruction."}</p>
  `;
  preview.classList.remove("hidden");
  $("#placeOrderBtn").disabled = false;
});

$("#placeOrderBtn").addEventListener("click", () => {
  if (!ensureAuth()) return;
  const cart = userCart();
  if (!cart.length) return alert("Cart empty");
  if (!state.currentAddress) return alert("Please add address first.");

  let total = 0;
  const items = [];
  for (const c of cart) {
    const p = state.products.find((x) => x.id === c.productId);
    if (!p || p.stock < c.qty) return alert(`Stock issue for ${p?.name || c.productId}`);
    p.stock -= c.qty;
    const lineTotal = p.price * c.qty;
    total += lineTotal;
    items.push({ productId: p.id, name: p.name, qty: c.qty, unitPrice: p.price, price: lineTotal });
  }

  const order = {
    id: `PV${Date.now()}`,
    userEmail: userId(),
    userName: state.currentUser.name,
    phone: state.currentUser.phone,
    items,
    total,
    address: state.currentAddress,
    payment: "cod",
    status: "order",
    createdAt: new Date().toISOString(),
  };

  state.orders.push(order);
  state.carts[userId()] = [];
  saveState();
  renderProducts();
  renderCartCount();
  renderMyOrders();
});

window.addEventListener("storage", () => {
  state.products = getJSON(KEYS.products, []);
  state.orders = getJSON(KEYS.orders, []);
  state.carts = getJSON(KEYS.carts, {});
  renderProducts();
  renderCartCount();
});

setInterval(() => {
  const latest = getJSON(KEYS.orders, []);
  if (JSON.stringify(latest) !== JSON.stringify(state.orders)) {
    state.orders = latest;
    if (!$("#ordersPage").classList.contains("hidden")) renderMyOrders();
  }
}, 1500);

updateAuthUi();
renderProducts();
renderCartCount();
showPage("store");
