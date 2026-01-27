import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

/* ===============================
   REAL-TIME BRAND LISTENER
================================ */
export function listenBrands(setBrands) {
  const q = query(
    collection(db, "brands"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setBrands(data);
  });
}

/* ===============================
   ADD BRAND
================================ */
export async function addBrand(name) {
  return addDoc(collection(db, "brands"), {
    name,
    createdAt: serverTimestamp()
  });
}

/* ===============================
   DELETE BRAND
================================ */
export async function deleteBrand(id) {
  return deleteDoc(doc(db, "brands", id));
}
