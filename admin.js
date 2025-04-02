import { db } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";  // Import getAuth and signOut

const auth = getAuth(); // Get the authentication instance
const content = document.getElementById("content");

// FETCH MENU ITEMS FROM FIRESTORE
async function fetchMenu() {
    const menuTable = document.getElementById("menuTableBody");
    if (!menuTable) return; // Prevent errors if the table doesn't exist yet

    menuTable.innerHTML = ""; // Clear table before loading new data
    
    const menuDocRef = doc(db, "Menu", "menuItems");
    const subcollections = ["burger-items", "pizza-items", "momos-items", "desert-items", "drinks-items"];

    for (const subcollection of subcollections) {
        const querySnapshot = await getDocs(collection(menuDocRef, subcollection));
        
        querySnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            addItemToTable(docSnap.id, item, subcollection);
        });
    }
}

// ADD ITEM TO TABLE
function addItemToTable(id, item, category) {
    const menuTable = document.getElementById("menuTableBody");
    if (!menuTable) return;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td><img src="${item.image}" width="50"></td>
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>${category}</td>
        <td>
            <button class="edit-btn" data-id="${id}" data-category="${category}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}">Edit</button>
            <button class="delete-btn" data-id="${id}" data-category="${category}">Delete</button>
        </td>
    `;
    menuTable.appendChild(row);
}

// ADD NEW ITEM
async function addItem(e) {
    e.preventDefault();
    
    const name = document.getElementById("itemName").value;
    const price = document.getElementById("itemPrice").value;
    const image = document.getElementById("itemImage").value;
    const category = document.getElementById("itemCategory").value;
    
    const newItemRef = doc(collection(doc(db, "Menu", "menuItems"), category));
    await setDoc(newItemRef, { name, price: Number(price), image });
    
    fetchMenu(); // Refresh table
    e.target.reset();
}

// DELETE ITEM WITH CONFIRMATION
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
        const category = e.target.dataset.category;

        // Confirmation dialog
        const confirmDelete = confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return; // If cancelled, do nothing
        
        await deleteDoc(doc(db, `Menu/menuItems/${category}/${id}`));
        fetchMenu(); // Refresh table
    }
});

// EDIT ITEM FUNCTIONALITY
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
        const id = e.target.dataset.id;
        const category = e.target.dataset.category;
        const oldName = e.target.dataset.name;
        const oldPrice = e.target.dataset.price;
        const oldImage = e.target.dataset.image;

        // Prompt for new values
        const newName = prompt("Enter new name:", oldName);
        const newPrice = prompt("Enter new price:", oldPrice);
        const newImage = prompt("Enter new image URL:", oldImage);

        if (!newName || !newPrice || !newImage) return; // If any value is missing, cancel

        // Update Firestore
        const itemRef = doc(db, `Menu/menuItems/${category}/${id}`);
        await updateDoc(itemRef, { name: newName, price: Number(newPrice), image: newImage });

        fetchMenu(); // Refresh table
    }
});

// LOGOUT FUNCTION
function logout() {
    signOut(auth).then(() => {
        // Redirect to admin.html after logout
        window.location.href = 'admin.html';
    }).catch((error) => {
        console.error('Error logging out: ', error);
    });
}

// HOME FUNCTION (For the "Home" button)
function goHome() {
    // Redirect to index.html (Home page)
    window.location.href = 'index.html';
}

// FUNCTIONS FOR LOADING DIFFERENT PAGES
function loadMenu() {
    content.innerHTML = `
        <h2>Modify Menu</h2>
        <p>View, edit, and delete Menu items</p>
        <table border="1">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="menuTableBody"></tbody>
        </table>
    `;
    fetchMenu(); // Call function to load menu items
}

function loadModifyMenu() {
    content.innerHTML = `
        <h2>Add to Menu</h2>
        <form id="addItemForm">
            <input type="text" id="itemName" placeholder="Item Name" required>
            <input type="number" id="itemPrice" placeholder="Price" required>
            <input type="text" id="itemImage" placeholder="Image URL" required>
            <select id="itemCategory">
                <option value="burger-items">Burger</option>
                <option value="pizza-items">Pizza</option>
                <option value="momos-items">Momos</option>
                <option value="desert-items">Desert</option>
                <option value="drinks-items">Drinks</option>
            </select>
            <button type="submit">Add Item</button>
        </form>
    `;
    document.getElementById("addItemForm").addEventListener("submit", addItem);
}

// EVENT LISTENERS FOR BUTTONS IN NAVIGATION
document.querySelector(".nav-buttons").addEventListener("click", (e) => {
    if (e.target.textContent === "Logout") {
        logout();  // Call logout function
    } else if (e.target.textContent === "Home") {
        goHome();  // Call home function
    }
});

async function manageUsers() {
    const container = document.getElementById("ordersContainer");
    container.innerHTML = "<h2>Loading users and orders...</h2>";

    const usersRef = collection(db, "Users");
    const usersSnapshot = await getDocs(usersRef);

    let tableHTML = `
        <h2>Manage Users & Orders</h2>
        <table border="1">
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Orders</th>
                </tr>
            </thead>
            <tbody id="usersTableBody">
    `;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const ordersRef = collection(db, `Users/${userId}/Orders`);
        const ordersSnapshot = await getDocs(ordersRef);

        let ordersHTML = "<ul>";
        ordersSnapshot.forEach((orderDoc) => {
            const order = orderDoc.data();
            ordersHTML += `
                <li>
                    <strong>Order ID:</strong> ${orderDoc.id} <br>
                    <strong>Status:</strong> <span id="status-${orderDoc.id}">${order.status}</span>
                    <select id="statusSelect-${orderDoc.id}">
                        <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
                        <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                    </select>
                    <button onclick="changeOrderStatus('${userId}', '${orderDoc.id}')">Update Status</button>
                </li>
            `;
        });
        ordersHTML += "</ul>";

        tableHTML += `
            <tr>
                <td>${userId}</td>
                <td>${userData.name || "N/A"}</td>
                <td>${userData.email || "N/A"}</td>
                <td>${ordersSnapshot.empty ? "No Orders" : ordersHTML}</td>
            </tr>
        `;
    }

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// Function to update order status
window.changeOrderStatus = async function (userId, orderId) {
    const newStatus = document.getElementById(`statusSelect-${orderId}`).value;
    const orderRef = doc(db, `Users/${userId}/Orders`, orderId);
    await updateDoc(orderRef, { status: newStatus });
    document.getElementById(`status-${orderId}`).textContent = newStatus;
    console.log(`Order ${orderId} status updated to ${newStatus}`);
};

// Make functions globally available so buttons in `dashboard.html` can call them
window.loadMenu = loadMenu;
window.loadModifyMenu = loadModifyMenu;
window.manageUsers = manageUsers;
