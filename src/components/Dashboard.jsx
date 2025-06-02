import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    deleteDoc,
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { signOut } from "firebase/auth";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";
import "./Dashboard.css";



function Dashboard() {
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("income");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [showProfileBox, setShowProfileBox] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const [editMode, setEditMode] = useState(false);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const profileRef = useRef(null);



    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileBox(false);
            }
        }

        if (showProfileBox) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileBox]);


    useEffect(() => {
        document.body.className = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setProfileData(data);
                    setEditFirstName(data.firstName || "");
                    setEditLastName(data.lastName || "");
                }
            }
        });

        return () => unsubscribe();
    }, []);


    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [loading, user, navigate]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "transactions"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
            setTransactions(data);
        });
        return () => unsubscribe();
    }, [user]);

    if (loading) return <p>⏳ Se verifică autentificarea...</p>;

    const totalIncome = transactions.filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalExpense = transactions.filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const balance = totalIncome - totalExpense;

    const getMonthlyData = () => {
        const monthlyIncome = Array(12).fill(0);
        const monthlyExpense = Array(12).fill(0);

        transactions.forEach((tx) => {
            if (!tx.timestamp) return;
            const date = tx.timestamp.toDate();
            const month = date.getMonth();
            if (tx.type === "income") {
                monthlyIncome[month] += Number(tx.amount || 0);
            } else {
                monthlyExpense[month] += Number(tx.amount || 0);
            }
        });

        return {
            labels: [...Array(12).keys()].map((m) =>
                new Date(0, m).toLocaleString("ro", { month: "short" })
            ),
            datasets: [
                {
                    label: "Venituri",
                    data: monthlyIncome,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                },
                {
                    label: "Cheltuieli",
                    data: monthlyExpense,
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                },
            ],
        };
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            await addDoc(collection(db, "transactions"), {
                uid: user.uid,
                amount: parseFloat(amount),
                type,
                description,
                timestamp: serverTimestamp(),
            });
            setMessage("✅ Tranzacție adăugată!");
            setAmount("");
            setDescription("");
        } catch (error) {
            console.error("Eroare:", error);
            setMessage("❌ Eroare la adăugare tranzacție.");
        }
    };

    const handleDeleteTransaction = async (id) => {
        if (!window.confirm("Ești sigur că vrei să ștergi această tranzacție?")) return;
        try {
            await deleteDoc(doc(db, "transactions", id));
            setMessage("🗑️ Tranzacție ștearsă cu succes.");
        } catch (error) {
            console.error("Eroare la ștergere:", error);
            setMessage("❌ Eroare la ștergerea tranzacției.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            console.error("Eroare la delogare:", err);
        }
    };
    const handleSaveProfile = async () => {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                firstName: editFirstName,
                lastName: editLastName,
            });
            setProfileData((prev) => ({
                ...prev,
                firstName: editFirstName,
                lastName: editLastName,
            }));
            setEditMode(false);
        } catch (error) {
            console.error("Eroare la actualizarea profilului:", error);
        }
    };


    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Raport tranzacții - SmartWallet Guard", 14, 20);
        doc.setFontSize(12);
        doc.text(`Total venituri: ${totalIncome.toFixed(2)} lei`, 14, 30);
        doc.text(`Total cheltuieli: ${totalExpense.toFixed(2)} lei`, 14, 37);
        doc.text(`Sold disponibil: ${balance.toFixed(2)} lei`, 14, 44);



        const filtered = transactions.filter((tx) => filter === "all" || tx.type === filter)
            .filter((tx) => {
                if (!tx.timestamp) return true;
                const date = tx.timestamp.toDate();
                const monthMatch = selectedMonth === "all" || date.getMonth().toString() === selectedMonth;
                const yearMatch = selectedYear === "all" || date.getFullYear().toString() === selectedYear;
                return monthMatch && yearMatch;
            });

        const tableData = filtered.map((tx) => [
            tx.timestamp?.toDate().toLocaleDateString() || "-",
            tx.type === "income" ? "Venit" : "Cheltuială",
            `${tx.amount} lei`,
            tx.description,
        ]);

        if (tableData.length === 0) tableData.push(["-", "-", "-", "-"]);
        autoTable(doc, { startY: 52, head: [["Data", "Tip", "Sumă", "Descriere"]], body: tableData });
        doc.save("tranzactii.pdf");
    };

    const handleExportCSV = () => {
        const rows = transactions.map((tx) => ({
            Data: tx.timestamp?.toDate().toLocaleString() || "N/A",
            Tip: tx.type === "income" ? "Venit" : "Cheltuială",
            Suma: tx.amount,
            Descriere: tx.description,
        }));

        const csvContent =
            "Data,Tip,Suma,Descriere\n" +
            rows
                .map((r) => `${r.Data},${r.Tip},${r.Suma},${r.Descriere}`)
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "tranzactii.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        const rows = transactions.map((tx) => ({
            Data: tx.timestamp?.toDate().toLocaleString() || "N/A",
            Tip: tx.type === "income" ? "Venit" : "Cheltuială",
            Suma: tx.amount,
            Descriere: tx.description,
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tranzactii");
        XLSX.writeFile(workbook, "tranzactii.xlsx");
    };


    return (
        <div className={`dashboard-container ${theme}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <h2>Dashboard</h2>
                <div>
                    <button onClick={handleLogout}>🚪 Delogare</button>
                    <button onClick={() => setShowProfileBox(!showProfileBox)}>👤 Profil</button>
                    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                        {theme === "light" ? "🌙 Mod întunecat" : "☀️ Mod luminos"}
                    </button>
                </div>
                {showProfileBox && profileData && (
                    <div ref={profileRef} className="profile-popup">
                        {!editMode ? (
                            <>
                                <p><strong>Nume:</strong> {profileData.firstName} {profileData.lastName}</p>
                                <p><strong>Email:</strong> {profileData.email}</p>
                                <button onClick={() => setEditMode(true)}>✏️ Editează profilul</button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Prenume"
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Nume"
                                    value={editLastName}
                                    onChange={(e) => setEditLastName(e.target.value)}
                                />
                                <button onClick={handleSaveProfile}>💾 Salvează</button>
                            </>
                        )}
                    </div>
                )}

            </div>

            {/* Formular tranzacții */}
            <form onSubmit={handleAddTransaction}>
                <input type="number" placeholder="Sumă" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <br />
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="income">Venit</option>
                    <option value="expense">Cheltuială</option>
                </select>
                <br />
                <input type="text" placeholder="Descriere" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <br />
                <button type="submit">Adaugă tranzacție</button>
            </form>

            {message && <p>{message}</p>}

            {/* Filtre + Export */}
            <h3>Tranzacțiile tale</h3>

            <div className="filters-export-container">
                {/* FILTRE */}
                <div className="filters">
                    <label>Tip:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Toate</option>
                        <option value="income">Doar venituri</option>
                        <option value="expense">Doar cheltuieli</option>
                    </select>

                    <label>Lună:</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        <option value="all">Toate</option>
                        {[...Array(12).keys()].map((m) => (
                            <option key={m} value={m}>
                                {new Date(0, m).toLocaleString("ro", { month: "long" })}
                            </option>
                        ))}
                    </select>

                    <label>An:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="all">Toți anii</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>

                {/* EXPORT */}
                <div className="exports">
                    <button type="button" onClick={handleExportPDF}>📄 Exportă în PDF</button>
                    <button type="button" onClick={handleExportCSV}>📁 Exportă CSV</button>
                    <button type="button" onClick={handleExportExcel}>📊 Exportă Excel</button>
                </div>
            </div>



            <h4>📈 Total venituri: {totalIncome.toFixed(2)} lei</h4>
            <h4>📉 Total cheltuieli: {totalExpense.toFixed(2)} lei</h4>
            <h3>💰 Sold disponibil: {balance.toFixed(2)} lei</h3>

            <h3>📊 Grafic venituri/cheltuieli pe luni</h3>
            <div style={{ maxWidth: "800px", margin: "20px auto" }}>
                <Bar data={getMonthlyData()} />
            </div>


            <ul>
                {transactions
                    .filter((tx) => filter === "all" || tx.type === filter)
                    .filter((tx) => {
                        if (!tx.timestamp) return true;
                        const date = tx.timestamp.toDate();
                        const monthMatch = selectedMonth === "all" || date.getMonth().toString() === selectedMonth;
                        const yearMatch = selectedYear === "all" || date.getFullYear().toString() === selectedYear;
                        return monthMatch && yearMatch;
                    })
                    .map((tx) => (
                        <li key={tx.id}>
                            <strong>{tx.type === "income" ? "+" : "-"}</strong>
                            {tx.amount} lei – {tx.description} {" "}
                            <small>({tx.timestamp?.toDate().toLocaleString?.() || "fără dată"})</small> {" "}
                            <button onClick={() => handleDeleteTransaction(tx.id)}>🗑️</button>
                        </li>
                    ))}
            </ul>
        </div>
    );
}


export default Dashboard;
