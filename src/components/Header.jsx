import NotificationBell from "./NotificationBell";

export default function Header() {
  return (
    <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-6">
      <h1 className="font-semibold">Inventory System</h1>
      <NotificationBell />
    </header>
  );
}