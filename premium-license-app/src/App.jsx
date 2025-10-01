import React, { useState, useEffect } from 'react';
// In your Codespaces project, these imports will be handled by the build process
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, query, setLogLevel } from 'firebase/firestore';


// --- Firebase Configuration ---
// This is your project's configuration object from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyD4J1uKAtjIMQzizRz5p7gCZa6E1OxWGt4",
  authDomain: "premium-product-dashboard.firebaseapp.com",
  projectId: "premium-product-dashboard",
  storageBucket: "premium-product-dashboard.firebasestorage.app",
  messagingSenderId: "1066956066907",
  appId: "1:1066956066907:web:5586c5d3de0444fb84ef7e"
};

// --- Helper Components ---

const UserForm = ({ onUserAdded }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [product, setProduct] = useState('Canva');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username.trim() || !email.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setError(''); // Clear error on success
        onUserAdded({ username, email, product });
        setUsername('');
        setEmail('');
        setProduct('Canva');
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g., john.doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., john.doe@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                 <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <select
                        id="product"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    >
                        <option value="Canva">Canva Teams</option>
                        <option value="Autodesk">Autodesk Teams</option>
                    </select>
                </div>
                {error && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform hover:scale-105">
                    Add User
                </button>
            </form>
        </div>
    );
};

const UserTable = ({ users, onStatusChange }) => {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-4xl overflow-x-auto">
             <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">User Records</h2>
            {users.length === 0 ? (
                 <p className="text-center text-gray-500 py-8">No users added yet. Add a user to see their record here.</p>
            ) : (
                <table className="w-full min-w-max text-left">
                    <thead className="border-b-2 border-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600">Username</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Feedback Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-800 font-medium">{user.username}</td>
                                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                <td className="py-3 px-4 text-gray-600">{user.product}</td>
                                <td className="py-3 px-4">
                                    <select
                                        value={user.status}
                                        onChange={(e) => onStatusChange(user.id, e.target.value)}
                                        className={`w-full p-2 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50
                                            ${user.status === 'Pending' ? 'bg-yellow-100 border-yellow-300 text-yellow-800 focus:ring-yellow-400' : ''}
                                            ${user.status === 'Check' ? 'bg-green-100 border-green-300 text-green-800 focus:ring-green-400' : ''}
                                            ${user.status === 'No Feedbacks' ? 'bg-gray-100 border-gray-300 text-gray-800 focus:ring-gray-400' : ''}
                                        `}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Check">Check</option>
                                        <option value="No Feedbacks">No Feedbacks</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    const [page, setPage] = useState('table'); // 'form' or 'table'
    const [users, setUsers] = useState([]);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This check prevents re-initialization if the firebaseConfig placeholder is still there.
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            console.warn("Firebase config is not set. Please update it in your code.");
            setIsLoading(false);
            return;
        }
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
            setLogLevel('debug');

            onAuthStateChanged(authInstance, user => {
                if (user) {
                    setUserId(user.uid);
                } else {
                     const signIn = async () => {
                        try {
                            // FIX: Check if __initial_auth_token exists before using it.
                            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                                await signInWithCustomToken(authInstance, __initial_auth_token);
                            } else {
                                await signInAnonymously(authInstance);
                            }
                        } catch(e) {
                            console.error("Anonymous sign-in failed:", e);
                        }
                    };
                    signIn();
                }
            });
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (db && userId) {
            setIsLoading(true);
            // SIMPLIFIED PATH: This is a more robust path for a standalone application.
            const usersCollectionPath = `premium_users/${userId}/records`;
            const q = query(collection(db, usersCollectionPath));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const usersData = [];
                querySnapshot.forEach((doc) => {
                    usersData.push({ id: doc.id, ...doc.data() });
                });
                setUsers(usersData);
                setIsLoading(false);
            }, (error) => {
                 console.error("Error fetching users:", error);
                 setIsLoading(false);
            });

            return () => unsubscribe();
        }
    }, [db, userId]);

    const handleUserAdded = async (newUser) => {
        if (!db || !userId) return;
        try {
             // SIMPLIFIED PATH
            const usersCollectionPath = `premium_users/${userId}/records`;
            await addDoc(collection(db, usersCollectionPath), {
                ...newUser,
                status: 'Pending', // Default status
                createdAt: new Date(),
            });
            setPage('table'); // Switch back to table view after adding
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const handleStatusChange = async (userIdToUpdate, newStatus) => {
        if (!db || !userId) return;
        try {
            // SIMPLIFIED PATH
            const userDocRef = doc(db, `premium_users/${userId}/records`, userIdToUpdate);
            await updateDoc(userDocRef, {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };
    
    const NavButton = ({ active, children, onClick }) => (
         <button 
             onClick={onClick}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
                 ${active 
                     ? 'bg-blue-600 text-white shadow-md' 
                     : 'bg-white text-gray-700 hover:bg-gray-100'
                 }`}
         >
             {children}
         </button>
    );

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Premium Product Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-600">Manage your Canva and Autodesk team users efficiently.</p>
                </header>

                <nav className="flex justify-center bg-white p-2 rounded-full shadow-sm mb-10 w-fit mx-auto">
                    <NavButton active={page === 'table'} onClick={() => setPage('table')}>View Users</NavButton>
                    <NavButton active={page === 'form'} onClick={() => setPage('form')}>Add User</NavButton>
                </nav>

                <main className="flex justify-center">
                    {isLoading ? (
                         <div className="text-center p-10">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="http://www.w3.org/2024/svg">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-gray-600">Loading User Data...</p>
                         </div>
                    ) : (
                        page === 'form' 
                        ? <UserForm onUserAdded={handleUserAdded} /> 
                        : <UserTable users={users} onStatusChange={handleStatusChange} />
                    )}
                </main>
                 <footer className="text-center mt-12">
                    <p className="text-sm text-gray-500">
                        Your User ID for this session: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId || "Authenticating..."}</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}

