async function updateCartIcon() {
  const cart = await getCarts();
  const count = cart.length;
  const cartIcon = document.getElementById("cart-icon");
  if (cartIcon) {
    cartIcon.innerHTML = `
    <i class="bi bi-cart"></i>
    <span class="m-1">
      <span class="nd-720">Keranjang</span>
      <span class="nd-512">(${count})</span>
    </span>`;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  setInterval(await updateCartIcon, 2000);
});

async function promptQuantityAndAdd(productId) {
  checkUID("addToCart");
  let [qtyStr, isCancel] = await prompt(
    "Masukkan jumlah produk yang ingin ditambahkan ke keranjang:",
    "number"
  );

  console.log(qtyStr, isCancel);

  if (isCancel) {
    return;
  }

  if (!qtyStr) {
    alert("Jumlah tidak boleh kosong.");
    return;
  }

  let qty = parseInt(qtyStr);

  if (isNaN(qty) || qty <= 0) {
    alert("Masukkan jumlah produk yang valid.");
    return;
  }

  await addToCart(productId, qty);
}

async function addToCart(productId, quantity = 1) {
  checkUID("addToCart");

  console.log(productId, quantity);

  const cart = await getCarts();

  let userData = await getUserData();

  for (let i = 0; i < quantity; i++) {
    cart.push(productId);
  }

  userData.cart = cart;
  localStorage.setItem("cart", JSON.stringify(cart));

  await updateUserDataToGitHub(userData);
  await updateCartIcon();

  alert(`Produk telah ditambahkan ke keranjang sebanyak ${quantity} item.`);
}

function addToCartFromProduct(productId) {
  checkUID("addToCart");

  const qtyInput = document.getElementById("quantity");
  let quantity = parseInt(qtyInput.value);
  if (isNaN(quantity) || quantity <= 0) {
    alert("Masukkan jumlah produk yang valid.");
    return;
  }

  addToCart(productId, quantity);
}

async function loadCart() {
  const cart = await getCarts();

  let cartCount = {};
  cart.forEach((id) => {
    cartCount[id] = (cartCount[id] || 0) + 1;
  });

  const cartItemsContainer = document.getElementById("cart-items");
  cartItemsContainer.innerHTML = "";
  let total = 0;

  if (Object.keys(cartCount).length === 0) {
    cartItemsContainer.innerHTML = "<p>Keranjang kosong.</p>";
  } else {
    let index = 1;
    for (let id in cartCount) {
      const product = products.find((p) => p.id === parseInt(id));
      if (product) {
        console.log(product);
        const qty = cartCount[id];
        const subtotal = product.price * qty;
        cartItemsContainer.innerHTML += `
      <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
      <div>
        <h5>${product.name}</h5>
        <p class="mb-0">${formatRupiah(product.price)} x ${qty}</p>
      </div>
      <button class="btn btn-danger btn-lg" onclick="removeFromCart(${
        product.id
      })">Hapus</button>
      </div>`;
        total += subtotal;
        index++;
      }
    }
  }
  const cartSummary = document.getElementById("cart-summary");
  cartSummary.innerHTML = `<h4>Total: ${formatRupiah(total)}</h4>`;
}

async function removeFromCart(productId) {
  const cart = await getCarts();
  const index = cart.indexOf(productId);
  if (index !== -1) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));

    let userData = await getUserData();
    userData.cart = cart;

    await updateUserDataToGitHub(userData);
    await loadCart();
    await updateCartIcon();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  AOS.init();
  if (document.getElementById("cart-items")) {
    loadCart();
  }
});
