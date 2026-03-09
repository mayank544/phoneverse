const KEYS = {
  products: "pv_products",
  users: "pv_users",
  currentUser: "pv_current_user",
  carts: "pv_carts",
  orders: "pv_orders",
};

const ADMIN_CRED = { username: "admin username", password: "admin12345678", session: "pv_admin_session" };

const defaultProducts = [
  {
    id: "p1",
    name: "ZamGlow Pearl Drop Earrings",
    desc: "Elegant pearl drop earrings for party and daily wear.",
    longDesc: "Premium anti-tarnish pearl drop earrings with lightweight comfort and elegant shine.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Anti-tarnish", "Lightweight", "Premium finish"],
    price: 499,
    stock: 40,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    name: "ZamGlow Hoop Earrings",
    desc: "Trendy hoops with glossy finish.",
    longDesc: "Classic hoop design with smooth lock and skin-safe polish for all-day use.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Skin safe", "Glossy finish", "Daily wear"],
    price: 299,
    stock: 55,
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
  },
];

function getJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function setJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

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
const pages = { store: $("#storePage"), checkout: $("#checkoutPage"), orders: $("#ordersPage") };
const FLOW = ["order", "shipped", "out_for_delivery", "delivered"];

function saveState() {
  setJSON(KEYS.products, state.products);
  setJSON(KEYS.users, state.users);
  setJSON(KEYS.carts, state.carts);
  setJSON(KEYS.orders, state.orders);
  setJSON(KEYS.currentUser, state.currentUser);
}

function normalizeOrders() {
  let changed = false;
  state.orders.forEach((o) => {
    o.items.forEach((i) => {
      if (!i.status) { i.status = "order"; changed = true; }
      if (!i.cancelRequest) { i.cancelRequest = "none"; changed = true; }
      if (!i.cancelMessage) { i.cancelMessage = ""; changed = true; }
    });
  });
  if (changed) saveState();
}
normalizeOrders();

function userId() { return state.currentUser?.email || "guest"; }
function userCart() {
  const id = userId();
  state.carts[id] = state.carts[id] || [];
  return state.carts[id];
}

function cartTotals() {
  const subtotal = userCart().reduce((sum, item) => {
    const p = state.products.find((x) => x.id === item.productId);
    return p ? sum + p.price * item.qty : sum;
  }, 0);
  const delivery = subtotal > 0 && subtotal < 500 ? 40 : 0;
  return { subtotal, delivery, tax: 0, total: subtotal + delivery };
}

function stockText(stock) {
  if (stock > 10) return "In Stock";
  if (stock > 0) return `Only ${stock} left`;
  return "Out of Stock";
}

function showPage(name) {
  Object.values(pages).forEach((p) => p.classList.add("hidden"));
  pages[name].classList.remove("hidden");
}
function ensureAuth() {
  if (state.currentUser) return true;
  $("#authSection").classList.remove("hidden");
  $("#authMsg").textContent = "Please sign in first.";
  return false;
}
function updateAuthUi() {
  $("#authBtn").textContent = state.currentUser ? `Sign Out (${state.currentUser.name})` : "Sign In";
}

function renderProducts() {
  const q = $("#searchInput").value.toLowerCase().trim();
  const grid = $("#productGrid");
  grid.innerHTML = "";
  state.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    .forEach((p) => {
      const node = $("#productCardTpl").content.firstElementChild.cloneNode(true);
      node.querySelector(".product-image").src = p.image;
      node.querySelector(".product-title").textContent = p.name;
      node.querySelector(".product-desc").textContent = p.desc;
      node.querySelector(".product-price").textContent = p.price;
      node.querySelector(".stock-label").textContent = stockText(p.stock);
      const disabled = p.stock <= 0;
      node.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
      node.querySelector(".view-btn").onclick = () => (location.href = `product-detail.html?id=${encodeURIComponent(p.id)}`);
      node.querySelector(".cart-btn").onclick = () => addToCart(p.id, 1);
      node.querySelector(".buy-btn").onclick = () => { addToCart(p.id, 1); showCheckout(); };
      grid.appendChild(node);
    });
}

function addToCart(productId, qty) {
  const p = state.products.find((x) => x.id === productId);
  if (!p || p.stock < qty) return alert("Out of stock.");
  const cart = userCart();
  const ex = cart.find((i) => i.productId === productId);
  if (ex) ex.qty = Math.min(ex.qty + qty, p.stock);
  else cart.push({ productId, qty });
  saveState();
  renderCartCount();
  if (!pages.checkout.classList.contains("hidden")) renderCheckout();
}
function updateCartItem(productId, qty) {
  const p = state.products.find((x) => x.id === productId);
  const item = userCart().find((x) => x.productId === productId);
  if (!p || !item) return;
  item.qty = Math.max(1, Math.min(qty, p.stock));
  saveState();
  renderCartCount();
  renderCheckout();
}
function removeCartItem(productId) {
  state.carts[userId()] = userCart().filter((x) => x.productId !== productId);
  saveState();
  renderCartCount();
  renderCheckout();
}
function renderCartCount() { $("#cartCount").textContent = userCart().reduce((s, i) => s + i.qty, 0); }

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
  if (!cart.length) wrap.innerHTML = "<p>Your cart is empty.</p>";
  cart.forEach((item) => {
    const p = state.products.find((x) => x.id === item.productId);
    if (!p) return;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `<div><strong>${p.name}</strong><p>₹${p.price} x ${item.qty} = ₹${p.price * item.qty}</p></div>
    <div class='cart-actions'><button class='btn btn-light m'>-</button><span>${item.qty}</span><button class='btn btn-light p'>+</button><button class='btn btn-light d'>Delete</button></div>`;
    row.querySelector(".m").onclick = () => updateCartItem(item.productId, item.qty - 1);
    row.querySelector(".p").onclick = () => updateCartItem(item.productId, item.qty + 1);
    row.querySelector(".d").onclick = () => removeCartItem(item.productId);
    wrap.appendChild(row);
  });
  const t = cartTotals();
  $("#cartSubtotal").textContent = t.subtotal;
  $("#deliveryCharge").textContent = t.delivery;
  $("#taxCharge").textContent = 0;
  $("#cartTotal").textContent = t.total;
}

function activateTracking(container, status) {
  const idx = FLOW.indexOf(status);
  container.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("active", i <= idx));
}

function requestCancellation(orderId, productId) {
  const order = state.orders.find((o) => o.id === orderId);
  const item = order?.items.find((i) => i.productId === productId);
  if (!item || item.cancelRequest !== "none") return;
  if (["delivered", "cancelled"].includes(item.status)) return alert("Cannot cancel now.");
  item.cancelRequest = "pending";
  item.cancelMessage = "Cancellation request sent.";
  saveState();
  renderMyOrders();
}

function renderMyOrders() {
  if (!ensureAuth()) return;
  showPage("orders");
  const list = $("#ordersList");
  list.innerHTML = "";
  const rows = [];
  state.orders.filter((o) => o.userEmail === userId()).slice().reverse().forEach((o) => o.items.forEach((i) => rows.push({ o, i })));
  if (!rows.length) return (list.innerHTML = "<div class='card'><p>No orders yet.</p></div>");

  rows.forEach(({ o, i }) => {
    const card = $("#orderCardTpl").content.firstElementChild.cloneNode(true);
    card.querySelector(".order-id").textContent = `Order ID: ${o.id}`;
    card.querySelector(".order-item").textContent = i.name;
    card.querySelector(".order-status").textContent = i.status.replaceAll("_", " ");
    card.querySelector(".order-qty").textContent = i.qty;
    card.querySelector(".order-price").textContent = i.price;
    const tw = card.querySelector(".mini-track");
    card.querySelector(".track-btn").onclick = () => { tw.classList.toggle("hidden"); activateTracking(tw, i.status); };
    const cbtn = card.querySelector(".cancel-btn");
    cbtn.onclick = () => requestCancellation(o.id, i.productId);
    const note = card.querySelector(".cancel-note");
    if (i.cancelRequest === "pending") { note.textContent = "Cancellation pending."; note.classList.remove("hidden"); cbtn.disabled = true; }
    if (i.cancelRequest === "accepted" || i.status === "cancelled") { note.textContent = "Product cancelled."; note.classList.remove("hidden"); cbtn.disabled = true; }
    if (i.cancelRequest === "declined") { note.textContent = `Declined: ${i.cancelMessage}`; note.classList.remove("hidden"); cbtn.disabled = true; }
    list.appendChild(card);
  });
}

$("#authBtn").onclick = () => {
  if (state.currentUser) {
    state.currentUser = null;
    saveState();
    updateAuthUi();
    renderCartCount();
    return showPage("store");
  }
  $("#authSection").classList.toggle("hidden");
};
$("#goHome").onclick = () => showPage("store");
$("#goCheckout").onclick = showCheckout;
$("#goOrders").onclick = renderMyOrders;
$("#searchInput").oninput = renderProducts;

$$(".tab").forEach((tab) => (tab.onclick = () => {
  $$(".tab").forEach((x) => x.classList.remove("active"));
  tab.classList.add("active");
  $("#signinForm").classList.toggle("hidden", tab.dataset.tab !== "signin");
  $("#signupForm").classList.toggle("hidden", tab.dataset.tab !== "signup");
  $("#authMsg").textContent = "";
}));

$("#signupForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const phone = $("#signupPhone").value.trim();
  const password = $("#signupPassword").value;
  if (!name || !email || !phone || !password) return ($("#authMsg").textContent = "All fields required.");
  if (state.users.some((u) => u.email === email)) return ($("#authMsg").textContent = "Account exists.");
  state.users.push({ name, email, phone, password });
  state.currentUser = { name, email, phone };
  saveState();
  updateAuthUi();
  renderCartCount();
  $("#authSection").classList.add("hidden");
};

$("#signinForm").onsubmit = (e) => {
  e.preventDefault();
  const emailOrUser = $("#signinEmail").value.trim().toLowerCase();
  const password = $("#signinPassword").value;

  if (emailOrUser === ADMIN_CRED.username && password === ADMIN_CRED.password) {
    localStorage.setItem(ADMIN_CRED.session, "1");
    location.href = "admin.html";
    return;
  }

  const user = state.users.find((u) => u.email === emailOrUser && u.password === password);
  if (!user) return ($("#authMsg").textContent = "Invalid email or password.");
  state.currentUser = { name: user.name, email: user.email, phone: user.phone };
  saveState();
  updateAuthUi();
  renderCartCount();
  $("#authSection").classList.add("hidden");
};

$("#addressForm").onsubmit = (e) => {
  e.preventDefault();
  state.currentAddress = {
    name: $("#addrName").value.trim(), phone: $("#addrPhone").value.trim(), line: $("#addrLine").value.trim(),
    city: $("#addrCity").value.trim(), state: $("#addrState").value.trim(), pincode: $("#addrPincode").value.trim(),
    instruction: $("#addrInstruction").value.trim(),
  };
  const p = $("#addressPreview");
  p.innerHTML = `<strong>Address Added</strong><p>${state.currentAddress.name} (${state.currentAddress.phone})</p><p>${state.currentAddress.line}, ${state.currentAddress.city}, ${state.currentAddress.state} - ${state.currentAddress.pincode}</p>`;
  p.classList.remove("hidden");
  $("#placeOrderBtn").disabled = false;
};

$("#placeOrderBtn").onclick = () => {
  if (!ensureAuth()) return;
  const cart = userCart();
  if (!cart.length) return alert("Cart empty");
  if (!state.currentAddress) return alert("Add address first");

  const t = cartTotals();
  const items = [];
  for (const c of cart) {
    const p = state.products.find((x) => x.id === c.productId);
    if (!p || p.stock < c.qty) return alert(`Stock issue for ${p?.name || c.productId}`);
    p.stock -= c.qty;
    items.push({ productId: p.id, name: p.name, qty: c.qty, unitPrice: p.price, price: p.price * c.qty, status: "order", cancelRequest: "none", cancelMessage: "" });
  }

  state.orders.push({
    id: `ZG${Date.now()}`,
    userEmail: userId(), userName: state.currentUser.name, phone: state.currentUser.phone,
    items, subtotal: t.subtotal, deliveryCharge: t.delivery, tax: 0, total: t.total,
    address: state.currentAddress, payment: "cod", createdAt: new Date().toISOString(),
  });

  state.carts[userId()] = [];
  saveState();
  renderProducts();
  renderCartCount();
  renderMyOrders();
};

window.addEventListener("storage", () => {
  state.products = getJSON(KEYS.products, []);
  state.orders = getJSON(KEYS.orders, []);
  state.carts = getJSON(KEYS.carts, {});
  normalizeOrders();
  renderProducts();
  renderCartCount();
});

setInterval(() => {
  const latestProducts = getJSON(KEYS.products, []);
  const latestOrders = getJSON(KEYS.orders, []);
  if (JSON.stringify(latestProducts) !== JSON.stringify(state.products)) { state.products = latestProducts; renderProducts(); }
  if (JSON.stringify(latestOrders) !== JSON.stringify(state.orders)) {
    state.orders = latestOrders;
    normalizeOrders();
    if (!$("#ordersPage").classList.contains("hidden")) renderMyOrders();
  }
}, 1500);

updateAuthUi();
renderProducts();
renderCartCount();
showPage("store");
