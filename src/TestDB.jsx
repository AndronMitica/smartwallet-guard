import { useEffect, useState } from "react";
import { db } from "./firebase/config";
import { collection, addDoc } from "firebase/firestore";

function TestDB() {
  const [status, setStatus] = useState("Testare conexiune...");

  useEffect(() => {
    const testFirestore = async () => {
      try {
        await addDoc(collection(db, "test"), {
          mesaj: "Conexiune reușită!",
          timestamp: new Date()
        });
        setStatus("✅ Conexiune la Firestore funcțională!");
      } catch (error) {
        console.error("Eroare Firestore:", error);
        setStatus("❌ Eroare la conectarea cu Firestore");
      }
    };

    testFirestore();
  }, []);

  return <p>{status}</p>;
}

export default TestDB;
