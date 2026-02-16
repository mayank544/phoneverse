const KEYS = {
  products: "pv_products",
  orders: "pv_orders",
};

const ADMIN = {
  email: "mayank75033@gmail.com",
  password: "m7503315833",
  session: "pv_admin_session",
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

const $ = (s) => document.querySelector(s);
function getJSON(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}
function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let products = getJSON(KEYS.products, defaultProducts);
let orders = getJSON(KEYS.orders, []);

if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);

function isLoggedIn() {
  return localStorage.getItem(ADMIN.session) === "1";
}

function showPanel() {
  $("#adminLogin").classList.add("hidden");
  $("#adminPanel").classList.remove("hidden");
  $("#adminSignOut").classList.remove("hidden");
  renderProducts();
  renderOrders();
}
function showLogin() {
  $("#adminLogin").classList.remove("hidden");
  $("#adminPanel").classList.add("hidden");
  $("#adminSignOut").classList.add("hidden");
}

$("#adminLoginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#adminEmail").value.trim().toLowerCase();
  const pass = $("#adminPassword").value;
  if (email === ADMIN.email && pass === ADMIN.password) {
    localStorage.setItem(ADMIN.session, "1");
    $("#adminMsg").textContent = "";
    showPanel();
  } else {
    $("#adminMsg").textContent = "Invalid admin credentials.";
  }
});

$("#adminSignOut").addEventListener("click", () => {
  localStorage.removeItem(ADMIN.session);
  showLogin();
});

function renderProducts() {
  const wrap = $("#productsAdminList");
  wrap.innerHTML = "";
  products.forEach((p) => {
    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "0.6rem";
    row.innerHTML = `
      <div class="product-admin-row">
        <img src="${p.image}" alt="${p.name}" class="thumb" />
        <div>
          <input data-field="name" data-id="${p.id}" value="${p.name}" />
          <textarea data-field="desc" data-id="${p.id}">${p.desc}</textarea>
          <textarea data-field="longDesc" data-id="${p.id}">${p.longDesc || ""}</textarea>
          <input data-field="brand" data-id="${p.id}" value="${p.brand || ""}" placeholder="Brand" />
          <input data-field="category" data-id="${p.id}" value="${p.category || ""}" placeholder="Category" />
          <input data-field="highlights" data-id="${p.id}" value="${(p.highlights || []).join(", ")}" placeholder="Highlights comma separated" />
          <div class="inline-inputs">
            <label>₹ <input type="number" min="1" data-field="price" data-id="${p.id}" value="${p.price}" /></label>
            <label>Stock <input type="number" min="0" data-field="stock" data-id="${p.id}" value="${p.stock}" /></label>
          </div>
          <div class="inline-inputs">
            <button class="btn btn-light" data-save-id="${p.id}">Save Changes</button>
            <button class="btn btn-light" data-delete-id="${p.id}">Delete Product</button>
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-save-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveId;
      const product = products.find((x) => x.id === id);
      if (!product) return;
      const fields = wrap.querySelectorAll(`[data-id='${id}']`);
      fields.forEach((f) => {
        const key = f.dataset.field;
        if (key === "price" || key === "stock") product[key] = Number(f.value);
        else if (key === "highlights") product.highlights = f.value.split(",").map((v) => v.trim()).filter(Boolean);
        else product[key] = f.value.trim();
      });
      setJSON(KEYS.products, products);
      renderProducts();
    });
  });

  wrap.querySelectorAll("button[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteId;
      products = products.filter((p) => p.id !== id);
      setJSON(KEYS.products, products);
      renderProducts();
    });
  });
}

function renderOrders() {
  const tbody = $("#ordersTable");
  tbody.innerHTML = "";
  const query = $("#orderSearch").value.toLowerCase().trim();
  const statusFilter = $("#statusFilter").value;

  orders
    .slice()
    .reverse()
    .filter((o) => {
      const text = `${o.id} ${o.userName} ${o.userEmail}`.toLowerCase();
      const byQuery = !query || text.includes(query);
      const byStatus = statusFilter === "all" || o.status === statusFilter;
      return byQuery && byStatus;
    })
    .forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.id}</td>
        <td>${o.userName}<br/><small>${o.userEmail}</small></td>
        <td>${o.phone}</td>
        <td>${o.items.map((i) => `${i.name} x${i.qty}`).join("<br/>")}</td>
        <td>₹${o.total}</td>
        <td>${o.address.line}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}</td>
        <td>
          <select data-order-id="${o.id}">
            <option value="order" ${o.status === "order" ? "selected" : ""}>Order</option>
            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
            <option value="out_for_delivery" ${o.status === "out_for_delivery" ? "selected" : ""}>Out for delivery</option>
            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll("select[data-order-id]").forEach((select) => {
    select.addEventListener("change", () => {
      const order = orders.find((o) => o.id === select.dataset.orderId);
      if (!order) return;
      order.status = select.value;
      setJSON(KEYS.orders, orders);
    });
  });
}

$("#orderSearch").addEventListener("input", renderOrders);
$("#statusFilter").addEventListener("change", renderOrders);

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const imageInput = $("#pImage");
  let image = "https://via.placeholder.com/500x300?text=Product";
  if (imageInput.files && imageInput.files[0]) {
    image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(imageInput.files[0]);
    });
  }

  const product = {
    id: `p${Date.now()}`,
    name: $("#pName").value.trim(),
    desc: $("#pDesc").value.trim(),
    longDesc: $("#pLongDesc").value.trim(),
    brand: $("#pBrand").value.trim(),
    category: $("#pCategory").value.trim(),
    highlights: $("#pHighlights").value.split(",").map((v) => v.trim()).filter(Boolean),
    price: Number($("#pPrice").value),
    stock: Number($("#pStock").value),
    image,
  };

  products.push(product);
  setJSON(KEYS.products, products);
  e.target.reset();
  renderProducts();
});

$("#clearOrders").addEventListener("click", () => {
  orders = [];
  setJSON(KEYS.orders, orders);
  renderOrders();
});

$("#resetDemoData").addEventListener("click", () => {
  products = [...defaultProducts];
  setJSON(KEYS.products, products);
  renderProducts();
});

window.addEventListener("storage", () => {
  products = getJSON(KEYS.products, []);
  orders = getJSON(KEYS.orders, []);
  if (isLoggedIn()) {
    renderProducts();
    renderOrders();
  }
});

setInterval(() => {
  const latestOrders = getJSON(KEYS.orders, []);
  if (JSON.stringify(latestOrders) !== JSON.stringify(orders)) {
    orders = latestOrders;
    if (isLoggedIn()) renderOrders();
  }
}, 1500);

if (isLoggedIn()) showPanel();
else showLogin();
