import { useEffect, useMemo, useState } from "react";
import { listenBrands } from "../firebase/brandService";

export default function BrandsPreview({ products = [] }) {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const unsub = listenBrands(setBrands);
    return () => unsub();
  }, []);

  const brandCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const preview = brands.slice(0, 4);

  if (brands.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border text-gray-500">
        No brands found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3">Brands</h2>

      <div className="space-y-3">
        {preview.map(b => (
          <div
            key={b.id}
            className="flex justify-between items-center border rounded-lg p-3"
          >
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-sm text-gray-500">
                {brandCounts[b.name] || 0} products
              </p>
            </div>
          </div>
        ))}
      </div>

      {brands.length > 4 && (
        <button className="mt-3 text-blue-600 text-sm hover:underline">
          View all brands ({brands.length})
        </button>
      )}
    </div>
  );
}
