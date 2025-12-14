import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Outlet />
    </div>
  );
}
