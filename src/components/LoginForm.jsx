import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import "./LoginForm.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const navigate = useNavigate();
  const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 60 * 1000; // 1 minut

const [attempts, setAttempts] = useState(0);
const [blockedUntil, setBlockedUntil] = useState(null);

useEffect(() => {
    const savedBlock = localStorage.getItem("blockedUntil");
    if (savedBlock && Date.now() < Number(savedBlock)) {
      setBlockedUntil(Number(savedBlock));
    }
  }, []);
  useEffect(() => {
    if (!blockedUntil) return;
  
    const interval = setInterval(() => {
      if (Date.now() >= blockedUntil) {
        setBlockedUntil(null);
        setAttempts(0);
        localStorage.removeItem("blockedUntil");
      }
    }, 1000);
  
    return () => clearInterval(interval);
  }, [blockedUntil]);
  

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    // Blocat temporar?
    if (blockedUntil && Date.now() < blockedUntil) {
      const sec = Math.ceil((blockedUntil - Date.now()) / 1000);
      setError(`⛔ Cont blocat temporar. Reîncearcă peste ${sec} secunde.`);
      return;
    }
  
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAttempts(0);
      localStorage.removeItem("blockedUntil");
      navigate("/dashboard");
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
  
      if (newAttempts >= MAX_ATTEMPTS) {
        const blockTime = Date.now() + BLOCK_DURATION_MS;
        setBlockedUntil(blockTime);
        localStorage.setItem("blockedUntil", blockTime);
        setError("⛔ Prea multe încercări. Cont blocat 1 minut.");
      } else {
        setError(`❌ Email sau parolă incorectă (${newAttempts}/${MAX_ATTEMPTS})`);
      }
    }
  };


  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Eroare la autentificarea cu Google:", error);
      setError("❌ Autentificare cu Google eșuată");
    }
  };

  return (
    <div className={`login-container ${theme}`}>
      <div className="login-header">
        <h2>Autentificare</h2>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Activează dark mode" : "Activează light mode"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Logare</button>
        {error && <p className="error">{error}</p>}
      </form>

      <button type="button" onClick={handleGoogleLogin} className="google-button">
        🔐 Autentifică-te cu Google
      </button>

      <p className="link">
        Ai uitat parola? <Link to="/reset-password">Recuperează parola</Link>
      </p>
      <p className="link">
        Nu ai cont? <Link to="/register">Creează unul acum</Link>
      </p>
    </div>
  );
}

export default LoginForm;
