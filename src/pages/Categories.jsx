import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  /* ===============================
     REALTIME LISTENERS
  =============================== */
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q, snap => {
      setCategories(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    });

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      snap => {
        setProducts(
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        );
      }
    );

    return () => {
      unsub();
      unsubProducts();
    };
  }, []);

  /* ===============================
     PRODUCT COUNT
  =============================== */
  const productCount = useMemo(() => {
    const map = {};
    products.forEach(p => {
      if (p.category) {
        map[p.category] = (map[p.category] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  /* ===============================
     DELETE
  =============================== */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    await deleteDoc(doc(db, "categories", id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      {categories.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl">
          No categories yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-sm p-4 border hover:border-blue-300 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500">
                    {productCount[cat.name] || 0} product
                    {productCount[cat.name] !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-x-2 text-sm">
                  <button className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
