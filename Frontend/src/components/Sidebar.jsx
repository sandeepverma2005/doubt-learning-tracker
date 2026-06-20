import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

// Nav items
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/ask-doubt", label: "Ask Doubt", icon: "💬" },
  { path: "/saved-questions", label: "Saved Questions", icon: "🔖" },
  { path: "/analytics", label: "Analytics", icon: "📈" },
];

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.log(err);
    } finally {
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">

      {/* ── Logo ── */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="text-base font-bold text-indigo-600">
            StudyMate AI
          </span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <span className="text-base">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
