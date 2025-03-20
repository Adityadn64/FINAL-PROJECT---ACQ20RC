document.addEventListener("DOMContentLoaded", async function () {
  const resultList = document.getElementById("result-list");
  const urlParams = new URLSearchParams(window.location.search);
  const productQuery = urlParams.get("products");
  const transactionQuery = urlParams.get("transactions");

  const createHeader = (text) => {
    const header = document.createElement("h3");
    header.textContent = text;
    header.className = "col-12 mt-4";
    resultList.appendChild(header);
  };

  if (!productQuery && !transactionQuery) {
    const messageElem = document.createElement("p");
    messageElem.textContent = "Tidak menemukan hasil pencarian yang sesuai.";
    messageElem.className = "text-center";
    resultList.appendChild(messageElem);
    return;
  }

  if (productQuery) {
    const products = await fetchProductsData();

    const filteredProducts = products.filter((product) => {
      const lowerQuery = productQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description &&
          product.description.toLowerCase().includes(lowerQuery))
      );
    });

    if (filteredProducts.length > 0) {
      createHeader("Produk");
      filteredProducts.forEach((product) => {
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
        resultList.appendChild(col);
      });
    } else {
      const messageElem = document.createElement("p");
      messageElem.textContent = "Produk tidak ditemukan.";
      messageElem.className = "text-center";
      resultList.appendChild(messageElem);
    }
  }

  if (productQuery && transactionQuery) {
    const hrElement = document.createElement("hr");
    resultList.appendChild(hrElement);
  }

  if (transactionQuery) {
    const userData = await getUserData();
    if (userData.transactions) {
      const entries = Object.entries(userData.transactions).sort((a, b) => {
        const parseDateFromKey = (key) => {
          const [year, month, day, hour, minute, second, ms] = key.split("_");
          return new Date(year, month - 1, day, hour, minute, second, ms);
        };
        return parseDateFromKey(b[0]) - parseDateFromKey(a[0]);
      });

      const filteredTransactions = entries.filter(([key, transaction]) => {
        const cartItems = transaction.products;
        let productCount = {};

        cartItems.forEach((product) => {
          const id = product.id;
          productCount[id] = (productCount[id] || 0) + 1;
        });

        const td = formatTransactionDate(key);
        const pm = transaction.payment_method;

        let total = 0;
        for (let id in productCount) {
          const prod = products.find((p) => p.id == id);
          if (prod) {
            const qty = productCount[id];
            const subtotal = prod.price * qty;
            total += subtotal;
          }
        }

        return (
          key.includes(transactionQuery) ||
          td[0].includes(transactionQuery) ||
          td[1].includes(transactionQuery) ||
          pm.includes(transactionQuery) ||
          total.toString().includes(transactionQuery) ||
          Object.values(productCount).join(",").includes(transactionQuery)
        );
      });

      if (filteredTransactions.length > 0) {
        createHeader("Transaksi");

        filteredTransactions.forEach(([transactionKey, transaction]) => {
          const col = document.createElement("div");
          col.className = "transactions-body col-lg-4 col-md-6 col-sm-12 mt-4";

          const card = document.createElement("div");
          card.className = "card h-100";

          const cardBody = document.createElement("div");
          cardBody.className = "card-body d-flex flex-column";
          cardBody.style.position = "relative";

          const td = formatTransactionDate(transactionKey);

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
          resultList.appendChild(col);

          col.addEventListener("click", () => {
            window.location.href = `transaction.html?date=${transactionKey}`;
          });
        });
      } else {
        const messageElem = document.createElement("p");
        messageElem.textContent = "Transaksi tidak ditemukan.";
        messageElem.className = "text-center";
        resultList.appendChild(messageElem);
      }
    } else {
      const messageElem = document.createElement("p");
      messageElem.textContent = "Anda belum melakukan transaksi apapun.";
      messageElem.className = "text-center";
      resultList.appendChild(messageElem);
    }
  }
});
