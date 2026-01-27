import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addProduct, getProductById, updateProduct } from "../firebase/productService";

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    sku: "", name: "", category: "", brand: "",
    unit: "kg", stock: 0, minStock: 10,
    price: 0, warehouse: "", expiryDate: "", description: ""
  });

  useEffect(() => {
    if (id) {
      getProductById(id).then(snap => {
        if (snap.exists()) setProduct(snap.data());
      });
    }
  }, [id]);

  const saveProduct = async (e) => {
    e.preventDefault();

    const data = {
      ...product,
      status: "Active",
      updatedAt: new Date().toISOString()
    };

    if (id) {
      await updateProduct(id, data);
      alert("Product updated");
    } else {
      await addProduct({ ...data, createdAt: new Date().toISOString() });
      alert("Product added");
    }

    navigate("/products");
  };

  return (
    <form onSubmit={saveProduct} className="max-w-4xl bg-white p-6 rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold">{id ? "Edit" : "Add"} Product</h1>

      {Object.entries(product).map(([key, val]) =>
        key !== "description" ? (
          <input
            key={key}
            placeholder={key}
            value={val}
            onChange={e => setProduct({ ...product, [key]: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        ) : (
          <textarea
            key={key}
            placeholder="Description"
            value={val}
            onChange={e => setProduct({ ...product, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        )
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate("/products")} className="border px-4 py-2 rounded">
          Cancel
        </button>
        <button className="bg-blue-600 text-white px-6 py-2 rounded">
          Save
        </button>
      </div>
    </form>
  );
}
