/* eslint no-undef: "off" */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../../hooks/useUserAuth";
import "../../styles/globals.css";
import "../../styles/sidebar.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserAuth();

  const [currentForm, setCurrentForm] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const API_BASE = "http://localhost:5000/api/auth";

  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = "#000";
    document.body.style.color = "#fff";
    return () => {
      document.body.style.backgroundColor = prevBg || "";
      document.body.style.color = prevColor || "";
    };
  }, []);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") === "success") {
      setSuccess("✅ Your email is verified! Please log in.");
      setCurrentForm("login");
    }
  }, [location]);

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

    const dots = Array.from({ length: 400 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 5 + 2,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    const animate = () => {
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
        gradient.addColorStop(0, `rgba(255,165,0,${dot.alpha})`);
        gradient.addColorStop(1, `rgba(255,69,0,0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };
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

  const switchForm = (target) => {
    setCurrentForm(target);
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user?.role) {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("role", data.user.role);
        login(data.user); // Use context login
        navigate(data.user.role === "admin" ? "/admin" : "/user", { replace: true });
      } else {
        setError(data.message || "Invalid credentials");
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
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Signup successful! Please check your email to verify your account.");
        setCurrentForm("login");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch {
      setError("Server error");
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSuccess("Reset link sent! Check your email.");
      else setError(data.message || "Error sending reset link");
    } catch {
      setError("Server error");
    }
  };

  const formClass = (form) => `form-transition ${currentForm === form ? "active" : "inactive"}`;

  return (
    <div className="flex items-center justify-center page-glow h-screen w-screen text-white relative bg-black">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ background: "transparent" }}
      />
      <div
        className="glass-box neon-glow p-8 w-full max-w-sm mx-auto text-center relative z-10 flex flex-col justify-between"
        style={{ minHeight: "480px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      >
        <div className="form-container flex flex-col justify-between h-full">
          <div className={formClass("login")}>
            <h2 className="text-2xl font-bold mb-6">
              Sign In to<br />
              <span className="block whitespace-nowrap">QuantumCopyTrading.com</span>
            </h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="neon-button w-full py-3 text-white font-semibold rounded-lg">Sign In</button>
            </form>
            {error && (
              <p className="text-red-500 mt-2">
                {error}
                {error === "Your account is disabled" && (
                  <span className="block mt-1 text-sm text-yellow-400">
                    Contact <a href="mailto:support@quantumcopytrading.com" className="underline">support@quantumcopytrading.com</a>
                  </span>
                )}
              </p>
            )}
            {success && <p className="text-green-500 mt-2">{success}</p>}
            <div className="mt-4 text-sm">
              <button type="button" onClick={() => switchForm("forgot")} className="text-white hover:underline">Forgot Password?</button>
            </div>
            <div className="mt-2 text-sm">
              Don't have an account?{" "}
              <button onClick={() => switchForm("signup")} className="text-white underline">Sign Up</button>
            </div>
          </div>
          <div className={formClass("signup")}>
            <h2 className="text-2xl font-bold mb-6">Create an Account</h2>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="neon-button w-full py-3 text-white font-semibold rounded-lg mt-2">Sign Up</button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {success && <p className="text-green-500 mt-2">{success}</p>}
            <div className="mt-4 text-sm flex justify-center">
              Already have an account?{" "}
              <button onClick={() => switchForm("login")} className="text-white underline ml-1">Back to Login</button>
            </div>
          </div>
          <div className={formClass("forgot")}>
            <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="neon-button w-full py-3 text-white font-semibold rounded-lg">Send Reset Link</button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {success && <p className="text-green-500 mt-2">{success}</p>}
            <div className="mt-4 text-sm flex justify-center">
              Remember your password?{" "}
              <button onClick={() => switchForm("login")} className="text-white underline ml-1">Back to Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}