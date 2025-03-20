const steps = [
  { step: 1, title: "Periksa Data Belanja" },
  { step: 2, title: "Periksa Informasi Anda" },
  { step: 3, title: "Pilih Metode Pembayaran" },
  { step: 4, title: "Lakukan Pembayaran" },
];

function getStep() {
  const params = new URLSearchParams(window.location.search);
  let step = parseInt(params.get("step"));
  if (!step || step < 1 || step > 4) step = 1;
  return step;
}

function goToStep(step) {
  window.location.href = "payment.html?step=" + step;
}

function renderStepNav(currentStep) {
  let navHtml = `<table class="table table-bordered text-center">
    <thead class="table-light">
      <tr>`;
  steps.forEach((s) => {
    navHtml += `<th class="${
      s.step === currentStep ? "bg-info text-white" : "text-muted"
    }">
      <small>Langkah ${s.step}</small>
    </th>`;
  });
  navHtml += `</tr></thead></table>`;
  document.getElementById("step-nav").innerHTML = navHtml;
}

function renderStepButtons(currentStep) {
  let btnHtml = `<div class="d-flex justify-content-end">`;
  if (currentStep > 1) {
    btnHtml += `<button class="btn btn-secondary btn-lg me-2" onclick="goToStep(${
      currentStep - 1
    })">Kembali</button>`;
  }
  if (currentStep === 2) {
    btnHtml += `<button class="btn btn-primary btn-lg" onclick="saveInfoAndLanjut()">Lanjut</button>`;
  } else if (currentStep < 4) {
    btnHtml += `<button class="btn btn-primary btn-lg" onclick="goToStep(${
      currentStep + 1
    })">Lanjut</button>`;
  } else {
    btnHtml += `<button class="btn btn-success btn-lg" onclick="processFinalPayment()">Submit</button>`;
  }
  btnHtml += `</div>`;
  document.getElementById("step-buttons").innerHTML = btnHtml;
}

async function displayStep1Content() {
  document.getElementById("step-content").innerHTML = `
    <h2 class="mb-3">Langkah ${steps[0].step}: ${steps[0].title}</h2>
    <div id="cart-summary-step" class="table-responsive"></div>`;
  await loadCartSummary();
}

var products = [];

var totalPrice = 0;
async function calculateTotalPrice() {
  products = await fetchProductsData();

  try {
    const cart = await getCarts();
    let cartCount = {};
    cart.forEach((id) => {
      cartCount[id] = (cartCount[id] || 0) + 1;
    });
    totalPrice = 0;
    for (let id in cartCount) {
      const product = products.find((p) => p.id === parseInt(id));
      if (product) {
        totalPrice += product.price * cartCount[id];
      }
    }
  } catch (err) {
    console.error("Error loading cart summary:", err);
  }
  return totalPrice;
}

async function getTotalPrice() {
  totalPrice = await calculateTotalPrice();
  console.log("Total Harga:", totalPrice);

  return totalPrice;
}

async function loadCartSummary() {
  products = await fetchProductsData();
  totalPrice = await getTotalPrice();
  const cart = await getCarts();

  let cartCount = {};
  cart.forEach((id) => {
    cartCount[id] = (cartCount[id] || 0) + 1;
  });
  let tableHtml = `<table class="table table-striped">
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Produk</th>
        <th>Harga</th>
        <th>Quantity</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>`;
  let index = 1;
  if (Object.keys(cartCount).length === 0) {
    tableHtml += `<tr><td colspan="5">Keranjang kosong.</td></tr>`;
  } else {
    for (let id in cartCount) {
      const product = products.find((p) => p.id === parseInt(id));
      if (product) {
        const qty = cartCount[id];
        const subtotal = product.price * qty;
        tableHtml += `<tr>
          <td>${index++}</td>
          <td>${product.name}</td>
          <td>${formatRupiah(product.price)}</td>
          <td>${qty}</td>
          <td>${formatRupiah(subtotal)}</td>
        </tr>`;
      }
    }
    tableHtml += `<tr class="table-light">
      <td colspan="4" class="text-end"><strong>Total</strong></td>
      <td><strong>${formatRupiah(totalPrice)}</strong></td>
    </tr>`;
  }
  tableHtml += `</tbody></table>`;
  document.getElementById("cart-summary-step").innerHTML = tableHtml;
}

async function displayStep2Content() {
  const userData = await getUserData();

  document.getElementById("step-content").innerHTML = `
    <h2 class="mb-3">Langkah ${steps[1].step}: ${steps[1].title}</h2>
    <form id="info-form" class="fs-5">
      <div class="mb-3">
        <label class="form-label">Nama Lengkap</label>
        <input type="text" class="form-control form-control-lg" id="infoName" value="${userData.name}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control form-control-lg" id="infoEmail" value="${userData.email}" required disabled>
      </div>
      <div class="mb-3">
        <label class="form-label">Telepon</label>
        <input type="text" class="form-control form-control-lg" id="infoPhone" value="${userData.phone}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Alamat</label>
        <input type="text" class="form-control form-control-lg" id="infoAddress" value="${userData.address}" required>
      </div>
    </form>`;
}

async function saveInfoAndLanjut() {
  const name = document.getElementById("infoName").value.trim();
  const email = document.getElementById("infoEmail").value.trim();
  const phone = document.getElementById("infoPhone").value.trim();
  const address = document.getElementById("infoAddress").value.trim();

  const userData = await getUserData();

  const transactions = userData.transactions ? userData.transactions : {};

  const updatedUser = {
    uid: userData.uid,
    name: name,
    email: userData.email,
    phone: phone,
    address: address,
    picture: userData.picture,
    cart: userData.cart,
    transactions: transactions,
  };

  if (!name || !email || !phone || !address) {
    alert("Semua input wajib diisi!");
    return;
  }

  localStorage.setItem("userData", JSON.stringify(updatedUser));
  await updateUserDataToGitHub(updatedUser);
  goToStep(3);
}

function displayStep3Content() {
  document.getElementById("step-content").innerHTML = `
    <h2 class="mb-3">Langkah ${steps[2].step}: ${steps[2].title}</h2>
    <br>
    <br>
    <div id="payment-method-buttons" class="d-flex justify-content-around mb-3">
      <button class="btn btn-outline-primary btn-lg m-2" data-method="bank">
        <i class="bi bi-building me-1"></i> Bank Transfer
      </button>
      <button class="btn btn-outline-primary btn-lg m-2" data-method="qr">
        <i class="bi bi-qr-code me-1"></i> Scan QR
      </button>
      <button class="btn btn-outline-primary btn-lg m-2" data-method="card">
        <i class="bi bi-credit-card me-1"></i> Kartu Kredit/Debit
      </button>
    </div>
    <br>
    <p class="text-center" id="infoChoose"></p>
  `;

  const infoChoose = document.getElementById("infoChoose");

  document.querySelectorAll("#payment-method-buttons button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const method = this.getAttribute("data-method");

      localStorage.setItem("paymentMethod", method);

      document
        .querySelectorAll("#payment-method-buttons button")
        .forEach((b) => {
          b.classList.remove("active");
        });

      this.classList.add("active");

      infoChoose.innerText =
        "Anda memilih metode pembayaran: " + this.innerText;
    });
  });

  const savedMethod = localStorage.getItem("paymentMethod");
  infoChoose.innerText =
    "Sebelum lanjut pilih metode pembayaran yang tersedia diatas";

  if (savedMethod) {
    const btn = document.querySelector(
      `#payment-method-buttons button[data-method="${savedMethod}"]`
    );
    if (btn) {
      btn.classList.add("active");
      infoChoose.innerText = "Anda memilih metode pembayaran: " + btn.innerText;
    }
  }
}

async function loadBankList() {
  try {
    const url =
      "https://gist.githubusercontent.com/muhammadyana/6abf8480799637b4082359b509410018/raw/indonesia-bank.json";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Gagal memuat data bank: " + response.status);
    }
    const banks = await response.json();
    const bankSelect = document.getElementById("bankName");

    bankSelect.innerHTML = '<option value="">Pilih Bank</option>';
    banks.forEach((bank) => {
      const option = document.createElement("option");
      option.value = bank.code;
      option.text = bank.name;
      bankSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loadBankList:", error);
  }
}

async function displayStep4Content() {
  await getTotalPrice();
  const method = localStorage.getItem("paymentMethod") || "card";
  let html = `<h2 class="mb-3">Langkah ${steps[3].step}: ${steps[3].title}</h2>`;
  if (method === "qr") {
    html += `<p class="fs-5">Silakan scan QR Code berikut dengan aplikasi pembayaran Anda:</p>
             <div id="qr-code" class="my-3"></div>`;
    document.getElementById("step-content").innerHTML = html;
    generateQRCode();
  } else if (method === "bank") {
    html += `<form id="final-payment-form" class="fs-5">
      <div class="mb-3">
        <label class="form-label">Nama Bank</label>
        <select class="form-control form-control-lg" id="bankName" required>
          <option value="">Pilih Bank</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Nomor Rekening</label>
        <input type="text" class="form-control form-control-lg" id="accountNumber" required>
      </div>
    </form>`;
    document.getElementById("step-content").innerHTML = html;

    await loadBankList();
  } else {
    html += `<form id="final-payment-form" class="fs-5">
      <div class="mb-3">
        <label class="form-label">Nomor Kartu Kredit/Debit</label>
        <input type="text" class="form-control form-control-lg" id="cardNumber" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Tanggal Kedaluwarsa (MM/YY)</label>
        <input type="text" class="form-control form-control-lg" id="expiry" placeholder="MM/YY" required>
      </div>
      <div class="mb-3">
        <label class="form-label">CVV</label>
        <input type="text" class="form-control form-control-lg" id="cvv" required>
      </div>
    </form>`;
    document.getElementById("step-content").innerHTML = html;
  }
}

async function processFinalPayment() {
  const method = localStorage.getItem("paymentMethod") || "card";
  let valid = true;

  if (method === "bank") {
    valid =
      document.getElementById("bankName").value.trim() &&
      document.getElementById("accountNumber").value.trim();
  } else if (method === "card") {
    valid =
      document.getElementById("cardNumber").value.trim() &&
      document.getElementById("expiry").value.trim() &&
      document.getElementById("cvv").value.trim();
  }

  if (!valid) {
    alert("Semua input wajib diisi!");
    return;
  }

  await alert(
    "Proses pembayaran...",
    true,
    7,
    [
      {
        timeOut: 3,
        message: "Pembayaran Berhasil!",
      },
    ],
    3
  );

  await clearCart(method);
}

async function clearCart(payment_method) {
  const userData = await getUserData();
  const transactions = userData.transactions ? userData.transactions : {};

  const updatedUser = {
    uid: userData.uid,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
    picture: userData.picture,
    cart: [],
    transactions: transactions,
  };

  console.log("clearCart", updatedUser);

  await saveTransaction(updatedUser, userData.cart, payment_method);

  updateCartIcon();
}

async function saveTransaction(userData, productIDs, paymentMethod) {
  let now = new Date();
  let transactionID =
    now.getFullYear() +
    "_" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "_" +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    "_" +
    String(now.getMinutes()).padStart(2, "0") +
    "_" +
    String(now.getSeconds()).padStart(2, "0") +
    "_" +
    String(now.getMilliseconds()).padStart(3, "0");

  const products = await fetchProductsData();

  const transactions = userData.transactions;
  let theProducts = [];

  productIDs.filter((id) => {
    products[id] ? theProducts.push(products[id]) : null;
  });

  transactions[transactionID] = {
    products: theProducts,
    payment_method: paymentMethod,
    user: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
    },
  };

  userData.transactions = transactions;

  await updateUserDataToGitHub(userData);
  localStorage.setItem("userData", JSON.stringify(userData));

  console.log("saveTransaction", userData);

  console.log("Transaksi berhasil disimpan dengan ID:", transactionID);

  window.location.href = `transaction.html?date=${transactionID}`;
}

function computeCRC(input) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function generateQRCode() {
  const qrContainer = document.getElementById("qr-code");
  if (!qrContainer) return;
  qrContainer.innerHTML = "";

  const payloadWithoutCRC = `00 02 01
01 0F ID.CO.QRIS000001
02 07 QRIS V2
03 02 12
04 03 360
05 06 ${totalPrice}
06 02 ID
07 0B BRI Virtual
08 07 Sidoarjo
63 04`;

  const payloadForCRC = payloadWithoutCRC + "0000";
  const crcValue = computeCRC(payloadForCRC);

  const finalPayload = payloadWithoutCRC + crcValue;

  new QRCode(qrContainer, {
    text: finalPayload,
    width: 200,
    height: 200,
  });
}

async function initPaymentSteps() {
  const step = getStep();
  products = await fetchProductsData();
  switch (step) {
    case 1:
      await displayStep1Content();
      break;
    case 2:
      await displayStep2Content();
      break;
    case 3:
      displayStep3Content();
      break;
    case 4:
      await displayStep4Content();
      break;
    default:
      displayStep1Content();
  }
  renderStepNav(step);
  renderStepButtons(step);
}

document.addEventListener("DOMContentLoaded", function () {
  AOS.init();
  initPaymentSteps();
});
