import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import AdminDashboard from "./components/Dashboard";
import UserDashboard from "./components/Users/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/Auth/ResetPassword";

function App() {
  return (
    <Router basename="/my-dashboard">
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* User Dashboard */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Reset Password */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Verify Email */}
        <Route path="/verify-email/:token" element={<Login />} /> {/* Redirect to login after verification */}

        {/* Catch-all redirects to login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;