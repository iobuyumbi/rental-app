import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query as firestoreQuery
} from 'firebase/firestore';

// Define global variables, mandatory for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Custom hook for managing real-time data persistence using Firebase Firestore.
 * This hook automatically handles offline buffering, synchronization, and authentication.
 * * @param {string} collectionName - The name of the Firestore collection (e.g., 'tasks', 'notes').
 * @param {boolean} [isPublic=false] - If true, stores data in the public collection path.
 * @returns {Object} State and CRUD actions (create, update, delete).
 */
const useFirestoreData = (collectionName, isPublic = false) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- 1. Authentication and Initialization ---

  useEffect(() => {
    // 1. Sign In
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
        setError("Failed to initialize authentication.");
      }
    };

    // 2. Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : 'anonymous');
      setIsAuthReady(true);
      setLoading(false);
    });

    authenticate();
    return () => unsubscribeAuth();
  }, []);

  // --- 2. Collection Path Calculation ---
  const collectionPath = useMemo(() => {
    if (!userId) return null;

    if (isPublic) {
      // Public path: /artifacts/{appId}/public/data/{collectionName}
      return `artifacts/${appId}/public/data/${collectionName}`;
    } else {
      // Private path: /artifacts/{appId}/users/{userId}/{collectionName}
      return `artifacts/${appId}/users/${userId}/${collectionName}`;
    }
  }, [userId, collectionName, isPublic]);

  // --- 3. Real-time Data Listener (onSnapshot) ---

  const refetch = useCallback(() => {
    if (!collectionPath || !isAuthReady) return;

    const colRef = collection(db, collectionPath);
    const q = firestoreQuery(colRef); // Using query() without orderBy for stability

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(newData);
      if (loading) setLoading(false);
      setError(null);
    }, (e) => {
      console.error("Firestore onSnapshot error:", e);
      setError("Failed to fetch data in real-time.");
      setLoading(false);
      toast.error("Real-time data synchronization failed.");
    });

    return unsubscribe;
  }, [collectionPath, isAuthReady, loading]); // Dependencies ensure listener restarts when path/auth status changes

  useEffect(() => {
    let unsubscribe;
    if (collectionPath && isAuthReady) {
      unsubscribe = refetch();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionPath, isAuthReady, refetch]);

  // --- 4. CRUD Operations (Offline Supported by SDK) ---

  const createItem = useCallback(async (itemData) => {
    if (!collectionPath || !isAuthReady) throw new Error("Database not initialized.");
    try {
      const colRef = collection(db, collectionPath);
      const newDocRef = await addDoc(colRef, itemData);
      toast.success(`${collectionName} created.`);
      return newDocRef.id;
    } catch (e) {
      toast.error(`Failed to create ${collectionName}. Writes are buffered offline.`);
      console.error("Create Item Error:", e);
      throw e;
    }
  }, [collectionPath, collectionName, isAuthReady]);

  const updateItem = useCallback(async (id, updates) => {
    if (!collectionPath || !isAuthReady) throw new Error("Database not initialized.");
    try {
      const docRef = doc(db, collectionPath, id);
      // NOTE: Firestore automatically merges updates (no need for spread)
      await updateDoc(docRef, updates); 
      toast.success(`${collectionName} updated.`);
    } catch (e) {
      toast.error(`Failed to update ${collectionName}. Writes are buffered offline.`);
      console.error("Update Item Error:", e);
      throw e;
    }
  }, [collectionPath, collectionName, isAuthReady]);

  const deleteItem = useCallback(async (id) => {
    if (!collectionPath || !isAuthReady) throw new Error("Database not initialized.");
    try {
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
      toast.success(`${collectionName} deleted.`);
    } catch (e) {
      toast.error(`Failed to delete ${collectionName}. Writes are buffered offline.`);
      console.error("Delete Item Error:", e);
      throw e;
    }
  }, [collectionPath, collectionName, isAuthReady]);

  return {
    data,
    loading,
    error,
    userId,
    isAuthReady,
    // CRUD Functions
    createItem,
    updateItem,
    deleteItem,
    refetch,
  };
};

export { useFirestoreData };
export default useFirestoreData;
