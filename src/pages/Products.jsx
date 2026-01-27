import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listenProducts, deleteProduct } from "../firebase/productService";
import BrandsPreview from "../components/BrandsPreview";

const ITEMS_PER_PAGE = 5;

export default function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const unsub = listenProducts(setProducts);
        return () => unsub();
    }, []);

    /* ===============================
       FILTERED DATA
    =============================== */
    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchSearch =
                p.name?.toLowerCase().includes(search) ||
                p.sku?.toLowerCase().includes(search);

            const matchCategory =
                category === "all" || p.category === category;

            return matchSearch && matchCategory;
        });
    }, [products, search, category]);

    /* ===============================
       PAGINATION
    =============================== */
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages, page]);

    const pageData = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    /* ===============================
       DELETE HANDLER
    =============================== */
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        await deleteProduct(id);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Products</h1>

            {/* ===============================
         BRANDS PREVIEW
      =============================== */}
            <BrandsPreview products={products} />

            {/* ===============================
         SEARCH + FILTER
      =============================== */}
            <div className="flex flex-wrap gap-3">
                <input
                    placeholder="Search products / SKU"
                    className="px-4 py-2 border rounded-lg"
                    onChange={e => {
                        setSearch(e.target.value.toLowerCase());
                        setPage(1);
                    }}
                />

                <select
                    className="px-4 py-2 border rounded-lg"
                    value={category}
                    onChange={e => {
                        setCategory(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="all">All Categories</option>
                    {[...new Set(products.map(p => p.category).filter(Boolean))].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <button
                    onClick={() => navigate("/products/add")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    + Add Product
                </button>
            </div>

            {/* ===============================
         PRODUCTS TABLE
      =============================== */}
            <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            {["SKU", "Name", "Category", "Brand", "Unit", "Min", "Status", "Actions"].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {pageData.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                    No products found
                                </td>
                            </tr>
                        ) : (
                            pageData.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-3">{p.sku}</td>
                                    <td className="px-6 py-3 font-medium">{p.name}</td>
                                    <td className="px-6 py-3">{p.category}</td>
                                    <td className="px-6 py-3">{p.brand}</td>
                                    <td className="px-6 py-3">{p.unit}</td>
                                    <td className="px-6 py-3">{p.minStock}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-3 py-1 rounded-full text-xs ${p.status === "Active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 space-x-3 text-sm">
                                        <button
                                            onClick={() => navigate(`/products/edit/${p.id}`)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id, p.name)}
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ===============================
         PAGINATION
      =============================== */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                    {filtered.length === 0
                        ? "Showing 0 entries"
                        : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                            page * ITEMS_PER_PAGE,
                            filtered.length
                        )} of ${filtered.length}`}
                </span>

                <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-8 h-8 border rounded ${page === i + 1
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
