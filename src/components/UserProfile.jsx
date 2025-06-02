import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.warn("Nu există date pentru utilizator.");
        }
      } catch (err) {
        console.error("Eroare la citirea profilului:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) return <p>⏳ Se încarcă profilul...</p>;

  if (!userData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Profil utilizator</h2>
        <p>❌ Nu s-au găsit date despre utilizator.</p>
      </div>
    );
  }

  const { firstName, lastName, email, createdAt } = userData;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Profil utilizator</h2>
      <p><strong>Nume complet:</strong> {firstName} {lastName}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Creat la:</strong> {createdAt?.toDate().toLocaleString() || "N/A"}</p>
    </div>
  );
}

export default UserProfile;
