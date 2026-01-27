// src/firebase/queries.js
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "./firebase";

/* ===============================
   PRODUCTS
================================ */

export const getProducts = () =>
  getDocs(collection(db, "products"));

export const addProduct = (data) =>
  addDoc(collection(db, "products"), data);

/* ===============================
   INVENTORY
================================ */

export const getInventory = () =>
  getDocs(collection(db, "inventory"));

/* ===============================
   USERS
================================ */

export const getUsersRealtime = (callback) => {
  const q = query(collection(db, "users"), orderBy("fullName"));
  return onSnapshot(q, callback);
};
