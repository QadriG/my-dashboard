const API_BASE = "http://localhost:5000/api"; // adjust if backend runs elsewhere

export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // important for cookies
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Login failed");
    }

    // ✅ Cookie is now set
    const checkRes = await fetch(`${API_BASE}/auth/check-auth`, {
      credentials: "include",
    });
    if (!checkRes.ok) throw new Error("Failed to fetch user");

    const user = await checkRes.json();

    localStorage.setItem("role", user.role);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (err) {
    console.error("Login error:", err.message);
    throw err;
  }
}

export async function logout() {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    return await res.json();
  } catch (err) {
    console.error("Logout error:", err.message);
    throw err;
  }
}
