const urlNow = window.location.href;
const header = document.querySelector("header");

header.className = "shadow-sm py-3 fixed-top";
header.innerHTML = `
  <div class="container d-flex flex-column align-items-center mt-2">
    <form id="searchForm" class="d-flex align-items-center w-75" style="max-width: 600px;">
      <input id="searchInput" class="form-control form-control-lg" type="search" placeholder="${
          urlNow.includes("transaction")
              ? "Cari transaksi..."
              : "Cari produk..."
      }" aria-label="Search">
			<label for="searchInput" class="m-1" id="labelSearchInput">
				<i class="bi bi-search me-2 text-secondary btn btn-light btn-lg"></i>
			</label>
		</form>
	</div>
`;

function searchForm() {
    const searchInputElm = document.getElementById("searchInput");
    const value = searchInputElm.value.trim();
    let nextSearch = false;
    value ? (nextSearch = true) : searchInputElm.focus();

    if (nextSearch)
        window.location.href =
            "search.html?" +
            (urlNow.includes("transaction") ? "transactions=" : "products=") +
            value;
}

document
    .getElementById("labelSearchInput")
    .addEventListener("click", () => searchForm());

document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    searchForm();
});

const footer = document.querySelector("footer");

footer.className = "py-3 fixed-bottom shadow-sm";
footer.innerHTML = `
	<div class="container d-flex justify-content-around">
	<a href="index.html" class="btn btn-warning btn-lg d-flex flex-column align-items-center">
		<i class="bi bi-bag"></i>
      <span class="m-1">
			<span class="nd-720">Cari</span>
			<span class="nd-512">Produk</span>
		</span>
	</a>
	<a href="transactions.html" class="btn btn-warning btn-lg d-flex flex-column align-items-center">
		<i class="bi bi-receipt"></i>
      <span class="m-1">
			<span class="nd-720">Cek</span>
			<span class="nd-512">Transaksi</span>
		</span>
	</a>
	<a id="cart-icon" href="cart.html" class="btn btn-primary btn-lg d-flex align-items-center">
		<i class="bi bi-cart"></i>
      <span class="m-1">
			<span class="nd-720">Keranjang</span>
			<span class="nd-512">(0)</span>
		</span>
	</a>
	<a href="profile.html" class="btn btn-secondary btn-lg d-flex flex-column align-items-center">
		<i class="bi bi-person-circle"></i>
		<span class="nd-512">Profil</span>
	</a>
	</div>
`;

const backAreaButton = document.getElementById("backAreaButton");
if (backAreaButton) {
    backAreaButton.innerHTML = `
		<div class="btn btn-primary btn-lg mb-4" id="backButton">
			<i class="bi bi-arrow-left"></i> <span class="nd-512>Kembali</span>
		</div>
		<br><br>
	`;
}

async function alert(
    message = "",
    isTime = false,
    timeOut = 5,
    messagesAfterTimeOut = {},
    awaitResolve = 0
) {
    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";

        const modalContent = document.createElement("div");
        modalContent.className =
            "modal-content d-flex align-items-center bg-light p-3";
        modalContent.style.width = "75%";
        modalContent.style.borderRadius = "5px";
        modalContent.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";

        const messageElem = document.createElement("p");
        messageElem.textContent = message;

        const timeOutElm = document.createElement("p");

        const btnContainer = document.createElement("div");
        btnContainer.style.marginTop = "20px";

        const okBtn = document.createElement("button");
        okBtn.className = "btn btn-primary btn-lg";
        okBtn.textContent = "OK";
        okBtn.style.minWidth = "80px";
        okBtn.style.display = "none";

        btnContainer.appendChild(okBtn);
        modalContent.appendChild(messageElem);
        if (isTime) modalContent.appendChild(timeOutElm);
        modalContent.appendChild(btnContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        const intervalId = setInterval(async () => {
            timeOut--;
            console.log(timeOut);
            if (messagesAfterTimeOut.length === 0) {
                timeOutElm.textContent = timeOut;
                okBtn.style.display = "";
            }

            if (messagesAfterTimeOut) {
                messagesAfterTimeOut.forEach((mes) => {
                    if (mes.timeOut >= timeOut) {
                        messageElem.textContent = mes.message;
                        timeOutElm.textContent = timeOut;
                        okBtn.style.display = "";
                    }
                });
            }

            if (timeOut <= 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, awaitResolve)
                );
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                okBtn.click();
                clearInterval(intervalId);
            }
        }, 1000);

        okBtn.addEventListener("click", function () {
            clearInterval(intervalId);
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            resolve();
        });
    });
}

async function prompt(message = "", type = "text", placeholder = "") {
    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        modalContent.style.width = "75%";
        modalContent.style.background = "#fff";
        modalContent.style.padding = "20px";
        modalContent.style.borderRadius = "5px";
        modalContent.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";

        const messageElem = document.createElement("p");
        messageElem.textContent = message;

        const input = document.createElement("input");
        input.type = type;
        input.required = "true";
        input.style.width = "100%";
        input.style.marginTop = "10px";
        input.placeholder = placeholder;
        input.className = "form-control form-control-lg";

        const btnContainer = document.createElement("div");
        btnContainer.style.marginTop = "20px";
        btnContainer.style.textAlign = "right";

        const okBtn = document.createElement("button");
        okBtn.className = "btn btn-success btn-lg";
        okBtn.textContent = "OK";
        okBtn.style.marginRight = "10px";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "btn btn-danger btn-lg";
        cancelBtn.textContent = "Batal";

        btnContainer.appendChild(okBtn);
        btnContainer.appendChild(cancelBtn);

        modalContent.appendChild(messageElem);
        modalContent.appendChild(input);
        modalContent.appendChild(btnContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        input.addEventListener("click", () => {
            input.removeAttribute("focus");
            input.removeAttribute("invalid");
            input.removeAttribute("style");
        });

        okBtn.addEventListener("click", function () {
            const value = input.value;
            if (input.value.trim().length > 0) {
                document.body.removeChild(modal);
                resolve([value, false]);
            } else {
                input.setAttribute("focus", true);
                input.setAttribute("invalid", true);
                input.style.border = "1px solid red";
                input.focus();
            }
        });

        cancelBtn.addEventListener("click", function () {
            document.body.removeChild(modal);
            resolve([null, true]);
        });
    });
}

document.querySelectorAll("main").forEach((elm) => {
    elm.setAttribute(
        "class",
        "hf row mt-4 d-flex flex-column align-items-center"
    );
    elm.setAttribute("data-aos", "fade-down");
});
