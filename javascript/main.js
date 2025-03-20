function checkUID(m = "") {
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const urlNow = window.location.href;
  const isNotValidUID = userData.length > 0 && !userData.uid;

  const message =
    m === "addToCart"
      ? "Silakan masuk terlebih dahulu untuk menambahkan produk ke keranjang."
      : isNotValidUID
      ? "Sesi Anda telah habis. Silakan masuk kembali untuk melanjutkan."
      : m === "jelajah"
      ? "Anda telah menjelajah produk selama 5 detik. Silakan masuk terlebih dahulu untuk mendapatkan pengalaman yang lebih baik."
      : null;

  if (
    (Object.keys(userData).length === 0 || isNotValidUID) &&
    !urlNow.includes("profile")
  ) {
    localStorage.clear();
    window.location.href =
      `profile.html?redirect=${urlNow}` +
      (message ? `&message=${message}` : "");
  }
}

setTimeout(() => {
  checkUID("jelajah");
}, 5000);

function formatRupiah(number) {
  return "Rp " + number.toLocaleString("id-ID");
}

async function loadProducts() {
  const products = await fetchProductsData();

  const productList = document.getElementById("product-list");
  if (!productList) return;
  productList.innerHTML = "";
  products.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col-lg-3 col-md-4 col-sm-6";

    const card = document.createElement("div");
    card.className = "card h-100";

    let thumbnail = "assets/";
    if (product.files && product.files.length > 0) {
      thumbnail += product.files[0];
    }
    let thumbHTML = "";
    if (thumbnail.match(/\.(jpg|jpeg|png|gif)$/i)) {
      thumbHTML = `<img src="${thumbnail}" class="card-img-top" alt="${product.name}">`;
    } else {
      thumbHTML = `<img src="img/placeholder.jpg" class="card-img-top" alt="${product.name}">`;
    }

    const cardBody = document.createElement("div");
    cardBody.className = "card-body d-flex flex-column";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.innerText = product.name;

    const desc = document.createElement("p");
    desc.className = "card-text";
    desc.innerText = product.description;

    const price = document.createElement("p");
    price.className = "card-text fw-bold";
    price.innerText = formatRupiah(product.price);

    const detailLink = document.createElement("a");
    detailLink.href = "product.html?id=" + product.id;
    detailLink.className = "btn btn-primary btn-lg mt-auto";
    detailLink.innerText = "Lihat Detail";

    const cartBtn = document.createElement("button");
    cartBtn.className = "btn btn-success btn-lg mt-2";
    cartBtn.innerText = "Tambah Keranjang";
    cartBtn.onclick = async function () {
      await promptQuantityAndAdd(product.id);
    };

    card.innerHTML = thumbHTML;
    cardBody.appendChild(title);
    cardBody.appendChild(desc);
    cardBody.appendChild(price);
    cardBody.appendChild(detailLink);
    cardBody.appendChild(cartBtn);
    card.appendChild(cardBody);
    col.appendChild(card);
    productList.appendChild(col);
  });
}

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get("id"));
  const container = document.getElementById("product-detail");
  if (!container) return;

  if (!productId) {
    container.innerText = "Produk tidak ditemukan.";
    return;
  }

  const products = await fetchProductsData();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    container.innerText = "Produk tidak ditemukan.";
    return;
  }
  let carouselHTML = "";
  if (product.files && product.files.length > 0) {
    carouselHTML += `<div id="carouselProduct" class="carousel slide" data-bs-ride="carousel">`;
    carouselHTML += `<div class="carousel-indicators">`;
    product.files.forEach((file, index) => {
      carouselHTML += `<button type="button" data-bs-target="#carouselProduct" data-bs-slide-to="${index}" ${
        index === 0 ? 'class="active" aria-current="true"' : ""
      } aria-label="Slide ${index + 1}"></button>`;
    });
    carouselHTML += `</div>`;
    carouselHTML += `<div class="carousel-inner">`;
    product.files.forEach((file, index) => {
      file = "assets/" + file;
      carouselHTML += `<div class="carousel-item ${
        index === 0 ? "active" : ""
      }">`;
      if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
        carouselHTML += `<img src="${file}" class="d-block w-100" alt="${product.name}">`;
      } else if (file.match(/\.(mp4|webm)$/i)) {
        carouselHTML += `<video class="d-block w-100" controls>
							<source src="${file}" type="video/mp4">
							Browser Anda tidak mendukung video.
						  </video>`;
      }
      carouselHTML += `</div>`;
    });
    carouselHTML += `</div>`;
    carouselHTML += `<button class="carousel-control-prev" type="button" data-bs-target="#carouselProduct" data-bs-slide="prev">
						  <span class="carousel-control-prev-icon bg-primary rounded-circle p-4" aria-hidden="true"></span>
						  <span class="visually-hidden">Previous</span>
						</button>
						<button class="carousel-control-next" type="button" data-bs-target="#carouselProduct" data-bs-slide="next">
						  <span class="carousel-control-next-icon bg-primary rounded-circle p-4" aria-hidden="true"></span>
						  <span class="visually-hidden">Next</span>
						</button>`;
    carouselHTML += `</div>`;
  }
  container.innerHTML = `
	  <div class="row">
		<div class="col-md-6">
		  ${carouselHTML}
		</div>
		<div class="col-md-6">
		  <h2>${product.name}</h2>
		  <p>${product.description}</p>
		  <h4 class="fw-bold">${formatRupiah(product.price)}</h4>
		  <div class="mb-2">
			<label for="quantity" class="form-label">Jumlah:</label>
			<input type="number" id="quantity" class="form-control form-control-lg" value="1" min="1" style="max-width:150px;">
		  </div>
		  <button class="btn btn-success btn-lg" onclick="addToCartFromProduct(${
        product.id
      })">
			Tambahkan ke Keranjang
		  </button>
		</div>
	  </div>
	`;
  AOS.refresh();
}

function formatTransactionDate(key) {
  const parts = key.split("_");
  if (parts.length !== 7) return key;

  const [year, month, day, hour, minute, second, ms] = parts;

  const dateObj = new Date(
    year,
    parseInt(month) - 1,
    day,
    hour,
    minute,
    second,
    ms
  );

  const formattedDate = dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedTime = dateObj.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return [formattedDate, formattedTime];
}

async function loadTransactions() {
  const userData = await getUserData();

  if (!userData.transactions) {
    document.getElementById("transaction-details").innerHTML =
      "<p>Anda belum melakukan transaksi apapun. Silahkan beli produk terlebih dahulu.</p>";
    return;
  }

  const transactions = userData.transactions || {};

  const transactionList = document.getElementById("transaction-list");
  if (!transactionList) return;
  transactionList.innerHTML = "";

  Object.entries(transactions)
    .sort((a, b) => {
      const parseDateFromKey = (key) => {
        const [year, month, day, hour, minute, second, ms] = key.split("_");
        return new Date(year, month - 1, day, hour, minute, second, ms);
      };

      return parseDateFromKey(b[0]) - parseDateFromKey(a[0]);
    })
    .forEach(([transactionKey, transaction]) => {
      const cartItems = transaction.products;
      let productCount = {};

      cartItems.forEach((product) => {
        const id = product.id;
        productCount[id] = (productCount[id] || 0) + 1;
      });

      let total = 0;
      for (let id in productCount) {
        const prod = products.find((p) => p.id == id);
        if (prod) {
          const qty = productCount[id];
          const subtotal = prod.price * qty;
          total += subtotal;
        }
      }

      let paymentIcon = "";
      switch (transaction.payment_method) {
        case "bank":
          paymentIcon = "bi-building";
          break;
        case "qr":
          paymentIcon = "bi-qr-code";
          break;
        case "card":
          paymentIcon = "bi-credit-card";
          break;
        default:
          paymentIcon = "bi-currency-dollar";
      }

      const col = document.createElement("div");
      col.className = "transactions-body col-lg-4 col-md-6 col-sm-12 mt-4";

      const card = document.createElement("div");
      card.className = "card h-100";

      const cardBody = document.createElement("div");
      cardBody.className = "card-body d-flex flex-column";

      cardBody.style.position = "relative";

      const td = formatTransactionDate(transactionKey);

      cardBody.innerHTML = `
		  <div class="payment-icon-bg">
			<i class="bi ${paymentIcon}" style="font-size: 2.5rem;"></i>
			<span class="m-2">Metode: ${
        transaction.payment_method ? transaction.payment_method : "N/A"
      }</span>
		  </div>
		  <div class="content">
			<div class="d-flex justify-content-between align-items-center">
			  <div class="transaction-total fw-bold">
				Total: ${formatRupiah(total)}
			  </div>
			</div>
			<div class="d-flex justify-content-between align-items-center mt-auto">
			  <div class="transaction-date">
				Tanggal: ${td[0]} <br> Waktu: ${td[1]}
			  </div>
			</div>
		  </div>
		`;

      card.appendChild(cardBody);
      col.appendChild(card);
      transactionList.appendChild(col);

      col.addEventListener(
        "click",
        () => (window.location.href = `transaction.html?date=${transactionKey}`)
      );
    });
}

let transactionKey;

async function loadTransactionDetail() {
  const params = new URLSearchParams(window.location.search);
  transactionKey = params.get("date");
  const detailsContainer = document.getElementById("transaction-details");
  const mainElement = document.querySelector("main");

  if (!transactionKey) {
    detailsContainer.innerHTML = "<p>Parameter date tidak ditemukan.</p>";
    return;
  }

  const userData = await getUserData();

  if (!userData.transactions || !userData.transactions[transactionKey]) {
    mainElement.innerHTML = "<p>Transaksi tidak ditemukan.</p>";
    return;
  }

  const transaction = userData.transactions[transactionKey];
  const cartItems = transaction.products;
  let productCount = {};

  cartItems.forEach((product) => {
    const id = product.id;
    productCount[id] = (productCount[id] || 0) + 1;
  });

  let total = 0;
  for (let id in productCount) {
    const prod = products.find((p) => p.id == id);
    if (prod) {
      const qty = productCount[id];
      const subtotal = prod.price * qty;
      total += subtotal;
    }
  }

  let index = 1;
  const td = formatTransactionDate(transactionKey);

  let html = `
	  <div class="receipt-header">
		<h2>TonS E-Commerce</h2>
		<hr>
		<p>Sidoarjo</p>
		<p>Telp: 0896-6804-1554</p>
		<p>Tanggal: ${td[0]} ${td[1]}</p>
	  </div>
	  <table class="receipt-table">
		<thead>
		  <tr>
			<th>No</th>
			<th>Produk</th>
			<th>Harga</th>
			<th>Qty</th>
			<th>Sub</th>
		  </tr>
		</thead>
		<tbody>
	`;

  console.log(cartItems);

  for (let index in productCount) {
    const prod = cartItems[index];
    const qty = productCount[prod.id];
    const subtotal = prod.price * qty;
    html += `
		<tr>
		<td>${index++}</td>
		<td>${prod.name}</td>
		<td>${formatRupiah(prod.price)}</td>
		<td>${qty}</td>
		<td>${formatRupiah(subtotal)}</td>
		</tr>
	`;
  }

  html += `
		  <tr class="total-row">
			<td colspan="4">Total</td>
			<td>${formatRupiah(total)}</td>
		  </tr>
		</tbody>
	  </table>
	  <div class="receipt-footer">
		<p>Terima kasih telah berbelanja di TonS</p>
		<p>Harap simpan struk ini sebagai bukti pembelian</p>
	  </div>
	`;

  detailsContainer.innerHTML = html;

  const wrapper = document.createElement("div");
  wrapper.className = "receipt-wrapper";
  wrapper.innerHTML = detailsContainer.innerHTML;
  detailsContainer.innerHTML = "";
  detailsContainer.appendChild(wrapper);

  const scaleX = detailsContainer.clientWidth / wrapper.scrollWidth;
  const scaleY = detailsContainer.clientHeight / wrapper.scrollHeight;
  const scale = Math.min(scaleX, scaleY);
  wrapper.style.transform = `scale(${scale})`;
}

document.addEventListener("DOMContentLoaded", function () {
  AOS.init();

  if (document.getElementById("product-list")) {
    loadProducts();
  }

  if (document.getElementById("product-detail")) {
    loadProductDetail();
  }

  if (document.getElementById("transaction-details")) {
    loadTransactionDetail();

    document
      .getElementById("download-pdf")
      .addEventListener("click", async () => {
        const mainElement = document.getElementById("transaction-details");
        const receiptWrapperElement =
          document.querySelector(".receipt-wrapper");

        const widthElement =
          receiptWrapperElement.offsetWidth - receiptWrapperElement.offsetLeft;
        const heightElement =
          receiptWrapperElement.offsetHeight - receiptWrapperElement.offsetTop;

        try {
          await html2pdf()
            .from(mainElement)
            .set({
              filename: `receipt_${transactionKey}.pdf`,
              image: { type: "png", quality: 3 },
              html2canvas: { scale: 3 },
              jsPDF: {
                unit: "px",
                format: [widthElement, heightElement],
                orientation: "portrait",
              },
            })
            .toPdf()
            .save();
        } catch (error) {
          console.error("Error generating PDF:", error);
        }
      });

    document
      .getElementById("print-receipt")
      .addEventListener("click", async () => {
        const mainElement = document.getElementById("transaction-details");
        const receiptWrapperElement =
          document.querySelector(".receipt-wrapper");

        const lastMainElement = mainElement.innerHTML;

        mainElement.innerHTML += `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
				<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
				<script src="https://printjs-4de6.kxcdn.com/print.min.css"></script>
				<link rel="stylesheet" href="stylesheet/styles.css">

				<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" defer></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.js"></script>
				<script src="https://unpkg.com/aos@2.3.1/dist/aos.js" defer></script>
				<script src="https://printjs-4de6.kxcdn.com/print.min.js"></script>
			`;

        await printJS("transaction-details", "html");

        mainElement.innerHTML = lastMainElement;
      });
  }

  if (document.getElementById("transaction-list")) {
    loadTransactions();
  }

  let backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
});
