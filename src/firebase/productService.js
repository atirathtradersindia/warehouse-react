import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

/* ===============================
   PRODUCTS
================================ */

export const listenProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("sku"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
};

export const getProductById = (id) =>
  getDoc(doc(db, "products", id));

export const addProduct = (data) =>
  addDoc(collection(db, "products"), data);

export const updateProduct = (id, data) =>
  updateDoc(doc(db, "products", id), data);

export const deleteProduct = (id) =>
  deleteDoc(doc(db, "products", id));

/* ===============================
   GENERIC COLLECTION LISTENER
================================ */

export const listenCollection = (name, cb) =>
  onSnapshot(collection(db, name), snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
