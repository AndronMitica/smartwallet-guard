import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import ResetPassword from "./components/ResetPassword";
import SplashScreen from "./components/SplashScreen";
import UserProfile from "./components/UserProfile";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<h2>Bine ai venit la SmartWallet Guard!</h2>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profil" element={<UserProfile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
