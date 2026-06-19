import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getDashboardStats } from "../services/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PropTypes from "prop-types";//ye bhi error se pahale nhi tha
// Topic pie chart colors
const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // User name localStorage se
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.log(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hello, {user?.fullName || "Student"} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Keep learning, keep growing!
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-indigo-500 text-lg">
                👤
              </span>
            )}
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {loading && (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Current Streak"
                value={`${stats.currentStreak} Days 🔥`}
                color="text-orange-500"
              />
              <StatCard
                label="Total Questions"
                value={stats.totalQuestions}
                color="text-indigo-600"
              />
              <StatCard
                label="Solved Questions"
                value={stats.solvedQuestions}
                color="text-green-500"
              />
              <StatCard
                label="Pending Questions"
                value={stats.pendingQuestions}
                color="text-red-500"
              />
            </div>

            {/* ── Bottom Section ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-700">
                    Recent Activity
                  </h2>
                  <button
                    onClick={() => navigate("/saved-questions")}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {stats.recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No activity yet. Ask your first question!
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.recentActivity.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              item.status === "Solved"
                                ? "bg-green-400"
                                : item.status === "Unsolved"
                                ? "bg-red-400"
                                : "bg-yellow-400"
                            }`}
                          />
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {item.status} a {item.topic} question
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {timeAgo(item.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Topic Distribution Pie Chart */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Topic Distribution
                </h2>

                {stats.topicDistribution.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No data yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.topicDistribution}
                        dataKey="count"
                        nameKey="topic"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {stats.topicDistribution.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} questions`,
                          name,
                        ]}
                      />
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-gray-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Stat Card Component ──
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Time Ago Helper ──
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}
//ye hatakar ek bar check error aa raha tha
StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};
export default Dashboard;