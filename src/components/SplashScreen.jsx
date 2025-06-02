import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css"; // stil separat (opțional)

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/login");
    }, 3000); // 3 secunde

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <img src="/logo.png" alt="SmartWallet Guard" className="splash-logo" />
      <h1>SmartWallet Guard</h1>
    </div>
  );
}

export default SplashScreen;
