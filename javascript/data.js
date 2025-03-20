var products = [];
var fileData = "";

const GITHUB_TOKEN = "";
const GITHUB_OWNER = "Adityadn64";
const GITHUB_REPO = "FINAL-PROJECT---ACQ20RC";
const USERS_FILE_PATH = "database/users.json";
const PRODUCTS_FILE_PATH = "database/products.json";

async function getUsers() {
    const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${USERS_FILE_PATH}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
        }
    );

    fileData = await res.json();
    let currentUsers = {};
    try {
        currentUsers = JSON.parse(atob(fileData.content));
    } catch (e) {
        console.error("Error parsing current users; using empty object", e);
    }
    return currentUsers;
}

async function getUserData() {
    const storedDataStr = localStorage.getItem("userData");
    if (!storedDataStr) return null;
    const storedData = JSON.parse(storedDataStr);

    const usersDB = await getUsers();
    let userData =
        storedData.uid && usersDB && usersDB[storedData.uid]
            ? usersDB[storedData.uid]
            : storedData;
    // Ensure uid is set
    if (storedData.uid) {
        userData.uid = storedData.uid;
    }
    return userData;
}

async function getCarts() {
    const userData = await getUserData();
    let localCart = [];
    const cartStr = localStorage.getItem("cart");
    if (cartStr) {
        try {
            localCart = JSON.parse(cartStr);
            if (!Array.isArray(localCart)) {
                localCart = [];
            }
        } catch (e) {
            console.error(
                "Error parsing local cart data; using empty array",
                e
            );
            localCart = [];
        }
    }

    let cartData;
    if (userData && userData.cart && Array.isArray(userData.cart)) {
        cartData = userData.cart;
    } else {
        cartData = localCart;
    }

    return cartData;
}

async function updateUserDataToGitHub(userData) {
    try {
        let currentUsers = await getUsers();
        const isNotValidUID = !userData.uid || userData.uid === undefined;

        if (isNotValidUID) {
            localStorage.clear();
            window.location.href =
                `/profile.html?redirect=${urlNow}` +
                (message ? `&message=${message}` : "");
        }

        currentUsers[userData.uid] = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            photo_profile: userData.picture,
            cart: userData.cart ? userData.cart : [],
            transactions: userData.transactions ? userData.transactions : {},
        };

        const newContent = btoa(JSON.stringify(currentUsers, null, 4));
        const updateRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${USERS_FILE_PATH}`,
            {
                method: "PUT",
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                },
                body: JSON.stringify({
                    message: "Update user data via login Google",
                    content: newContent,
                    sha: fileData.sha,
                }),
            }
        );

        const result = await updateRes.json();
        console.log("Update user data result:", result, currentUsers);
    } catch (err) {
        console.error("Error updating user data to GitHub:", err);
    }
}

async function fetchProductsData() {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCTS_FILE_PATH}`,
        {
            headers: {
                Accept: "application/vnd.github.v3+json",
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
        }
    );
    const data = await response.json();
    const fileContent = atob(data.content);
    products = JSON.parse(fileContent);
    return products;
}

document.addEventListener("DOMContentLoaded", async function () {
    AOS.init();
    products = await fetchProductsData();
});
