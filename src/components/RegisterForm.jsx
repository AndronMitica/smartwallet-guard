import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "./LoginForm.css";

function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("❌ Parolele nu coincid.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizare nume complet în profil
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Salvare în Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        email,
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("❌ Există deja un cont cu acest email.");
      } else {
        setError("❌ Eroare la înregistrare: " + err.message);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>Înregistrare</h2>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Activează dark mode" : "Activează light mode"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nume"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Prenume"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
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
        <input
          type="password"
          placeholder="Confirmă parola"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Creează cont</button>

        {error && <p className="error">{error}</p>}
      </form>

      <p className="link">
        Ai deja cont? <Link to="/login">Autentifică-te</Link>
      </p>
    </div>
  );
}
export default RegisterForm;