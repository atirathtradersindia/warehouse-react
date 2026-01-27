import useBrands from "../hooks/useBrands";
import useProducts from "../hooks/useProducts";
import { useNavigate } from "react-router-dom";

export default function Brands() {
  const { brands, loading } = useBrands();
  const { products } = useProducts();
  const navigate = useNavigate();

  const productCount = products.reduce((acc, p) => {
    if (p.brand) acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <p className="text-gray-500">Loading brands...</p>;
  }

  if (!brands.length) {
    return (
      <div className="text-center text-gray-500">
        No brands yet.
        <br />
        <button
          onClick={() => navigate("/products")}
          className="text-blue-600 mt-2"
        >
          Go back to Products
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Brands</h1>

      <button
        onClick={() => navigate("/products")}
        className="mb-6 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        ← Back to Products
      </button>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map(brand => (
          <div
            key={brand.id}
            className="bg-white rounded-xl shadow-sm p-4 border hover:border-blue-300 transition"
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{brand.name}</h4>
                <p className="text-sm text-gray-500">
                  {productCount[brand.name] || 0} products
                </p>
              </div>

              <div className="space-x-3 text-sm">
                <button className="text-blue-600">Edit</button>
                <button className="text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
