import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-section");
  const signupSection = document.getElementById("signup-section");
  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("toggle-login");
  const adminLink = document.getElementById("admin-link");

  document.getElementById("show-signup").addEventListener("click", () => {
    loginForm.style.display = "none";
    signupSection.style.display = "block";
  });

  document.getElementById("show-login").addEventListener("click", () => {
    signupSection.style.display = "none";
    loginForm.style.display = "block";
  });

  signupBtn.addEventListener("click", async (event) => {
    event.preventDefault();
  
    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
  
    if (!username || !email || !password) {
      alert("Please fill all fields.");
      return;
    }
  
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // ✅ Store user details in Firestore with Firebase UID
      await setDoc(doc(db, "Users", user.uid), { 
        username, 
        email, 
        role: "user" 
      });
  
      alert("Account Created Successfully! Please log in.");
      signupSection.style.display = "none"; 
      loginForm.style.display = "block"; 
  
    } catch (error) {
      console.error("Signup Error: ", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Retrieve user data from Firestore
      const userDocRef = doc(db, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        localStorage.setItem("username", userData.username); // Store username for later use
      }

      alert("Login Successful!");
      window.location.href = "product.html";
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        adminLink.style.display = "block";
      }
    } else {
      if (loginBtn) {
        loginBtn.textContent = "Login";
        loginBtn.onclick = () => {
          document.getElementById("login-form").style.display = "block";
        };
      }
    }
  });
});



