/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globals.css";
import "../../styles/sidebar.css";

export default function Login() {
  const navigate = useNavigate();
  const [currentForm, setCurrentForm] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const dots = [];
    for (let i = 0; i < 400; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 5 + 2,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((dot) => {
        const dx = mouseRef.current.x - dot.x;
        const dy = mouseRef.current.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = distance > 100 ? 0 : (100 - distance) / 100;
        dot.vx += (dx / 50) * force;
        dot.vy += (dy / 50) * force;

        dot.x += dot.vx;
        dot.y += dot.vy;

        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        dot.vx *= 0.95;
        dot.vy *= 0.95;

        const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.size);
        gradient.addColorStop(0, `rgba(255, 165, 0, ${dot.alpha})`);
        gradient.addColorStop(1, `rgba(255, 69, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }

    animate();

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const switchForm = (target) => setCurrentForm(target);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Redirect based on role
        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      } else {
        setError(data.msg || "Invalid credentials");
      }
    } catch {
      setError("Server error");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "user" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentForm("login");
      } else {
        setError(data.msg);
      }
    } catch {
      setError("Server error");
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    alert("Reset link sent if email exists!");
  };

  const formClass = (form) =>
    `form-transition ${currentForm === form ? "active" : "inactive"}`;

  return (
    <div className="flex items-center justify-center page-glow h-screen w-screen text-white relative">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div
        className="glass-box neon-glow p-8 w-full max-w-sm mx-auto text-center relative z-10"
        style={{
          minHeight: "420px",
          background: "transparent",
          backdropFilter: "none",
        }}
      >
        <div className="form-container">
          {/* LOGIN */}
          <div className={formClass("login")}>
            <h2 className="text-2xl font-bold mb-6">
              Sign In to QuantumCopyTrading.com
            </h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full mb-4 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white border border-white focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full mb-6 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white border border-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="neon-button w-full py-3 text-white font-semibold rounded-lg"
              >
                Sign In
              </button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <div className="mt-4 text-sm">
              <button
                type="button"
                onClick={() => switchForm("forgot")}
                className="text-white hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="mt-2 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => switchForm("signup")}
                className="text-white underline"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* SIGNUP */}
          <div className={formClass("signup")}>
            <h2 className="text-2xl font-bold mb-6">Create an Account</h2>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full mb-4 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full mb-4 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full mb-4 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full mb-6 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="neon-button w-full py-3 text-white font-semibold rounded-lg"
              >
                Sign Up
              </button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <div className="mt-4 text-sm flex justify-center">
              Already have an account?{" "}
              <button
                onClick={() => switchForm("login")}
                className="text-white underline ml-1"
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}
          <div className={formClass("forgot")}>
            <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
            <form onSubmit={handleForgot}>
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field w-full mb-6 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white focus:outline-none"
                required
              />
              <button
                type="submit"
                className="neon-button w-full py-3 text-white font-semibold rounded-lg"
              >
                Send Reset Link
              </button>
            </form>
            <div className="mt-4 text-sm">
              Remembered your password?{" "}
              <button
                onClick={() => switchForm("login")}
                className="text-white underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
