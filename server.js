const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const ADMIN_EMAIL = "info@tradingmachine.ai";
const ADMIN_HASHED_PASSWORD = "$2b$12$nUUzwUFI0.ItQrtFTFDmjORxnzwNzKvUrcfxPGwaB/0ENe8VXywRq"; 

const app = express();
const PORT = 5000;
const JWT_SECRET = "supersecretkey"; // Use env variable in production

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// In-memory users database (replace with real DB)
let users = [
  {
    id: 1,
    username: "admin",
    email: "admin@quantum.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
  }
];

// Signup
app.post("/signup", (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) return res.status(400).json({ msg: "All fields required" });
  
  const exists = users.find(u => u.email === email);
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: Date.now(), username, email, password: hashedPassword, role };
  users.push(newUser);
  res.status(201).json({ msg: "Signup successful" });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ msg: "Invalid credentials" });

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, { httpOnly: true, sameSite: "Lax" });
  res.json({ msg: "Login successful", role: user.role });
});

// Check authentication (ProtectedRoute uses this)
app.get("/check-auth", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ msg: "Invalid token" });
    res.json({ role: user.role });
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out" });
});

// Forgot password (mock)
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ msg: "If email exists, reset link sent" });
  // In production, send reset email here
  res.json({ msg: "Reset link sent if email exists" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
