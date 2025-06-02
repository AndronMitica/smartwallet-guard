import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("📧 Email de resetare trimis. Verifică inbox-ul.");
    } catch (error) {
      setMessage("❌ Eroare: " + error.message);
    }
  };

  return (
    <div>
      <h2>Recuperare parolă</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Emailul tău"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <button type="submit">Trimite email de resetare</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ResetPassword;
