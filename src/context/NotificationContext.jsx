import { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const userId =
    localStorage.getItem("currentUserId") || "demo-user";

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setNotifications(data);
      setUnread(data.filter(n => !n.read).length);
    });

    return () => unsub();
  }, [userId]);

  const notify = async ({ title, message, type = "info", priority = "medium" }) => {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      priority,
      read: false,
      createdAt: serverTimestamp()
    });
  };

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications
        .filter(n => !n.read)
        .map(n =>
          updateDoc(doc(db, "notifications", n.id), { read: true })
        )
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unread,
        notify,
        markRead,
        markAllRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/* ✅ THIS EXPORT WAS MISSING / NOT PICKED UP */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }
  return ctx;
}
