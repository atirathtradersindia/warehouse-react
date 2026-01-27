import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "brands"), orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        setBrands(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
        setLoading(false);
      },
      error => {
        console.error("Brands listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { brands, loading };
}
