import { useNotifications } from "../context/NotificationContext";

export function useNotify() {
  const { notify } = useNotifications();

  function expiryNotify(product, days) {
    notify({
      type: "expiry",
      priority: days <= 3 ? "high" : "medium",
      title: "Expiry Alert",
      message:
        days < 0
          ? `${product} expired ${Math.abs(days)} days ago`
          : `${product} expires in ${days} days`
    });
  }

  function lowStockNotify(product, qty) {
    notify({
      type: "low_stock",
      priority: "medium",
      title: "Low Stock Alert",
      message: `${product} is low (${qty} left)`
    });
  }

  return { expiryNotify, lowStockNotify };
}
