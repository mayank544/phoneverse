const products = JSON.parse(localStorage.getItem("pv_products") || "[]");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const product = products.find((p) => p.id === id);
const wrap = document.getElementById("detailWrap");

if (!product) {
  wrap.innerHTML = `<h2>Product not found</h2><p>Go back to store and select another product.</p>`;
} else {
  wrap.innerHTML = `
    <div>
      <img class="detail-image" src="${product.image}" alt="${product.name}" />
    </div>
    <div>
      <h1>${product.name}</h1>
      <p class="price">₹${product.price}</p>
      <p><strong>Stock:</strong> ${product.stock}</p>
      <p><strong>Short Description:</strong> ${product.desc}</p>
      <p><strong>Brand:</strong> ${product.brand || "PhoneVerse"}</p>
      <p><strong>Category:</strong> ${product.category || "General"}</p>
      <hr />
      <h3>Full Product Details</h3>
      <p>${product.longDesc || product.desc}</p>
      <h3>Highlights</h3>
      <ul>
        ${(product.highlights || ["Quality checked", "Fast dispatch", "COD available"]).map((h) => `<li>${h}</li>`).join("")}
      </ul>
    </div>
  `;
}
