const CLIENT_ID =
  "819389601271-fl7jsirpdkepkcou78erki5hmi30rrbm.apps.googleusercontent.com";
let tokenClient;
let accessToken;

async function handleCredentialResponse(response) {
  const idToken = response.credential;
  const payload = JSON.parse(atob(idToken.split(".")[1]));
  const uid = payload.sub;

  localStorage.setItem("userData", JSON.stringify({ uid: uid }));

  let userData = await getUserData();
  if (!userData || Object.keys(userData).length === 0) {
    userData = {
      uid: uid,
      name: payload.name,
      picture: payload.picture,
      email: payload.email,
    };
  }

  await updateUserDataToGitHub(userData);

  localStorage.setItem("cart", JSON.stringify(userData.cart || []));

  window.location.reload();
}

function handleAccessTokenResponse(response) {
  accessToken = response.access_token;
  console.log("Access Token:", accessToken);
  fetchUserAdditionalInfo();
}

async function fetchUserAdditionalInfo() {
  let userData = JSON.parse(localStorage.getItem("userData"));
  if (userData && userData.uid && accessToken) {
    try {
      const res = await fetch(
        "https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,addresses",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok)
        throw new Error("Gagal mendapatkan data tambahan: " + res.status);
      const additionalData = await res.json();
      console.log("Data tambahan:", additionalData);

      if (
        additionalData.phoneNumbers &&
        additionalData.phoneNumbers.length > 0
      ) {
        userData.phone = additionalData.phoneNumbers[0].value;
      }
      if (additionalData.addresses && additionalData.addresses.length > 0) {
        userData.address = additionalData.addresses[0].formattedValue;
      }
      localStorage.setItem("userData", JSON.stringify(userData));
      console.log("User Data Lengkap:", userData);
    } catch (err) {
      console.error("Error fetching additional info:", err);
    }
  } else {
    console.warn("Data UID atau access token tidak tersedia.");
  }
}

async function renderGoogleLoginButton() {
  const container = document.getElementById("profile-container");

  document
    .querySelectorAll("#googleSignInButton")
    .forEach((elm) => elm.remove());

  const urlNow = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect") || urlNow;
  const message =
    urlParams.get("message") ||
    "Silakan masuk ke akun Anda terlebih dahulu untuk melanjutkan:";

  container.innerHTML = `
    <p class="text-center" style="text-decoration: underline; font-style: italic;">${message}</p>
    <span class="text-center m-4">Klik tombol di bawah ini untuk masuk:</span>
    <div id="googleSignInButton"></div>
  `;

  let isGoogle = false;
  do {
    try {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          await handleCredentialResponse(response);
          window.location.href = redirectUrl;
        },
        auto_select: false,
        button_auto_select: false,
        scope:
          "email profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read",
      });

      google.accounts.id.prompt();

      google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { theme: "outline", size: "large" }
      );

      isGoogle = true;
    } catch (e) {
      console.error("Error initializing Google login:", e);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (!isGoogle);
}

async function initProfile() {
  const userData = await getUserData();
  if (userData && Object.keys(userData).length > 0) {
    renderProfileForm(userData);
  } else {
    await renderGoogleLoginButton();
  }
}

function renderProfileForm(userData) {
  const container = document.getElementById("profile-container");
  container.innerHTML = `
    <form id="profileForm" class="fs-5">
      <div class="mb-2">
        <input class="form-control form-control-lg" type="text" id="name" placeholder="Nama" value="${
          userData.name || ""
        }" required>
      </div>
      <div class="mb-2">
        <input class="form-control form-control-lg" type="email" id="email" placeholder="Email" value="${
          userData.email || ""
        }" required disabled>
      </div>
      <div class="mb-2">
        <input class="form-control form-control-lg" type="text" id="phone" placeholder="No. HP" value="${
          userData.phone || ""
        }" required>
      </div>
      <div class="mb-2">
        <input class="form-control form-control-lg" type="text" id="address" placeholder="Alamat" value="${
          userData.address || ""
        }" required>
      </div>
      <br>
      <button class="btn btn-primary btn-lg" type="button" id="saveProfile">Simpan</button>
      <br><br>
      <button class="btn btn-danger btn-lg" type="button" id="logout">Keluar Akun</button>
    </form>`;

  document
    .getElementById("saveProfile")
    .addEventListener("click", async function () {
      const updatedUser = {
        uid: userData.uid,
        name: document.getElementById("name").value.trim(),
        email: userData.email,
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        picture: userData.picture,
        cart: userData.cart,
      };

      if (
        !updatedUser.name ||
        !updatedUser.email ||
        !updatedUser.phone ||
        !updatedUser.address
      ) {
        alert("Semua input wajib diisi!");
        return;
      }

      localStorage.setItem("userData", JSON.stringify(updatedUser));
      await updateUserDataToGitHub(updatedUser);
      document.getElementById("status").innerText = "Profil berhasil disimpan!";
    });

  document.getElementById("logout").addEventListener("click", function () {
    localStorage.removeItem("userData");
    window.location.reload();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  AOS.init();
  initProfile();
});
