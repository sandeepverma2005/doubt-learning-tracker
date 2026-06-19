import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  getDailyActivityGraph,
  getSolvedVsUnsolved,
  getSubjectAnalytics,
  getWeakTopics,
} from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];
const DAYS_OPTIONS = [7, 14, 30];

function Analytics() {
  const [days, setDays] = useState(7);
  const [dailyData, setDailyData] = useState([]);
  const [solvedData, setSolvedData] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);
// Yeh change karo
useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dailyRes, solvedRes, subjectRes, weakRes] = await Promise.all([
        getDailyActivityGraph(days),
        getSolvedVsUnsolved(),
        getSubjectAnalytics(),
        getWeakTopics(),
      ]);
      setDailyData(dailyRes.data.data);
      setSolvedData(solvedRes.data.data);
      setSubjectData(subjectRes.data.data);
      setWeakTopics(weakRes.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Topic distribution from subjectData for pie chart
  const topicPieData = subjectData.map((s) => ({
    name: s.subject.split(" ")[0], // short name
    value: s.totalQuestions,
  }));

  // Solved vs Unsolved pie
  const solvedPieData = solvedData
    ? [
        { name: "Solved", value: solvedData.solved },
        { name: "Unsolved", value: solvedData.unsolved },
        { name: "Pending", value: solvedData.pending },
      ]
    : [];

  // AI Insight text
  const aiInsight = () => {
    if (!solvedData || !weakTopics.length) return "Keep practicing to get insights!";
    const weakNames = weakTopics.slice(0, 2).map((t) => t.topic).join(" and ");
    return `You are doing great! 🎉 But you should focus more on ${weakNames}. Your completion rate is ${solvedData.solvedPercentage}%.`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Track your learning progress</p>
          </div>

          {/* Days selector */}
          <div className="flex gap-2">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  days === d
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : (
          <div className="space-y-6">

            {/* Row 1: Daily Activity + Solved vs Unsolved */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Daily Activity Line Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Daily Activity</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="questionsAsked"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Asked"
                    />
                    <Line
                      type="monotone"
                      dataKey="questionsSolved"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Solved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Solved vs Unsolved Donut */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Solved vs Unsolved</h2>
                {solvedData?.total === 0 ? (
                  <p className="text-gray-300 text-sm text-center py-10">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={solvedPieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {solvedPieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={["#10b981", "#ef4444", "#f59e0b"][i]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}`, n]} />
                      <Legend
                        formatter={(v) => (
                          <span className="text-xs text-gray-500">{v}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Row 2: Topic Distribution + AI Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Topic Distribution Pie */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Topic Distribution</h2>
                {topicPieData.length === 0 ? (
                  <p className="text-gray-300 text-sm text-center py-10">No data yet.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={topicPieData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {topicPieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="space-y-2">
                      {topicPieData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="text-xs text-gray-600">{item.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Insight */}
              <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
                <h2 className="font-semibold text-gray-700 mb-4">AI Insight</h2>

                {/* Weak topics */}
                {weakTopics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Weak Topics</p>
                    <div className="space-y-2">
                      {weakTopics.slice(0, 3).map((t) => (
                        <div
                          key={t.topic}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {t.topic}
                          </span>
                          <span className="text-xs text-red-400">
                            {t.solveRate}% solved
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insight text */}
                <div className="mt-auto bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {aiInsight()}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default Analytics;