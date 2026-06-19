import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getSavedQuestions, updateQuestionStatus, saveQuestion, deleteQuestion } from "../services/api";

const SUBJECTS = [
  "All Subjects",
  "Data Structures & Algorithms",
  "Operating Systems",
  "DBMS",
  "Computer Networks",
  "Object Oriented Programming",
  "System Design",
];

const TOPICS = [
  "All Topics",
  "Arrays", "Linked List", "Trees", "Graphs", "DP", "Recursion",
  "Processes", "Threads", "Memory Management",
  "SQL", "Normalization", "Transactions",
  "OSI Model", "TCP/IP", "DNS",
  "Classes", "Inheritance", "Polymorphism",
  "Load Balancing", "Caching", "Microservices",
];

const STATUSES = ["All Status", "Pending", "Solved", "Unsolved"];

const STATUS_COLORS = {
  Solved: "bg-green-100 text-green-600",
  Unsolved: "bg-red-100 text-red-500",
  Pending: "bg-yellow-100 text-yellow-600",
};

function SavedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    subject: "All Subjects",
    topic: "All Topics",
    status: "All Status",
  });
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getSavedQuestions();
      setQuestions(res.data.data);
    } catch (err) {
      console.log(err);
      setError("Failed to load saved questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (questionId, status) => {
    try {
      await updateQuestionStatus(questionId, status);
      setQuestions((prev) =>
        prev.map((q) => (q._id === questionId ? { ...q, status } : q))
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleUnsave = async (questionId) => {
    try {
      await saveQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (questionId) => {
    try {
      await deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
    } catch (err) {
      console.log(err);
    }
  };

  const filtered = questions.filter((q) => {
    const matchSubject = filters.subject === "All Subjects" || q.subject === filters.subject;
    const matchTopic = filters.topic === "All Topics" || q.topic === filters.topic;
    const matchStatus = filters.status === "All Status" || q.status === filters.status;
    const matchSearch =
      search === "" ||
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchTopic && matchStatus && matchSearch;
  });

  const grouped = filtered.reduce((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = [];
    acc[q.subject].push(q);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Saved Questions</h1>
        <p className="text-gray-400 text-sm mb-6">
          All your saved questions organised by topic
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 w-52"
          />
          <select
            value={filters.subject}
            onChange={(e) => setFilters((p) => ({ ...p, subject: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={filters.topic}
            onChange={(e) => setFilters((p) => ({ ...p, topic: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading && <div className="text-center text-gray-400 py-20">Loading...</div>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-300 py-20">
            <span className="text-5xl block mb-3">🔖</span>
            <p className="text-sm">No saved questions found.</p>
          </div>
        )}

        {/* Grouped layout */}
        <div className="flex gap-6">
          {/* Subject sidebar */}
          <div className="w-56 flex-shrink-0 space-y-2">
            {Object.entries(grouped).map(([subject, qs]) => (
              <div key={subject} className="bg-white rounded-xl shadow-sm px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">{subject}</p>
                <p className="text-xl font-bold text-indigo-600">{qs.length}</p>
              </div>
            ))}
          </div>

          {/* Question cards */}
          <div className="flex-1 space-y-3">
            {Object.entries(grouped).map(([, qs]) =>
              qs.map((q) => (
                <div key={q._id} className="bg-white rounded-xl shadow-sm px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p
                        className="text-sm text-gray-700 font-medium cursor-pointer hover:text-indigo-600 transition"
                        onClick={() => setExpanded(expanded === q._id ? null : q._id)}
                      >
                        {q.questionText}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">{q.topic}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>
                          {q.status}
                        </span>
                        <span className="text-xs text-gray-300">
                          {new Date(q.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-300"
                      >
                        <option>Pending</option>
                        <option>Solved</option>
                        <option>Unsolved</option>
                      </select>
                      <button onClick={() => handleUnsave(q._id)} title="Remove from saved" className="text-yellow-400 hover:text-yellow-500 text-base">★</button>
                      <button onClick={() => handleDelete(q._id)} title="Delete" className="text-gray-300 hover:text-red-400 text-base">🗑</button>
                    </div>
                  </div>

                  {expanded === q._id && (
                    <div className="mt-3 bg-indigo-50 rounded-lg p-3 text-sm text-gray-600 whitespace-pre-wrap">
                      {q.aiAnswer || q.manualAnswer || "No answer saved."}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SavedQuestions;