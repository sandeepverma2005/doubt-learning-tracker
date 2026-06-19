import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { askQuestion, saveQuestion, updateQuestionStatus } from "../services/api";

// Fixed dropdown data
const SUBJECTS = [
  "Data Structures & Algorithms",
  "Operating Systems",
  "DBMS",
  "Computer Networks",
  "Object Oriented Programming",
  "System Design",
];

const TOPICS = {
  "Data Structures & Algorithms": ["Arrays", "Linked List", "Trees", "Graphs", "DP", "Recursion", "Sorting", "Searching"],
  "Operating Systems": ["Processes", "Threads", "Memory Management", "Scheduling", "Deadlock"],
  "DBMS": ["Normalization", "SQL", "Transactions", "Indexing", "ER Model"],
  "Computer Networks": ["OSI Model", "TCP/IP", "DNS", "HTTP", "Routing"],
  "Object Oriented Programming": ["Classes", "Inheritance", "Polymorphism", "Abstraction", "Encapsulation"],
  "System Design": ["Load Balancing", "Caching", "Database Design", "Microservices", "API Design"],
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function AskDoubt() {
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    difficulty: "",
    questionText: "",
    useAI: true,
    manualAnswer: "",
  });

  const [result, setResult] = useState(null); // saved question data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [marked, setMarked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Subject change hone par topic reset karo
      ...(name === "subject" ? { topic: "" } : {}),
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSaved(false);
    setMarked(false);

    if (!formData.subject || !formData.topic || !formData.difficulty || !formData.questionText) {
      setError("All fields are required.");
      return;
    }

    if (!formData.useAI && !formData.manualAnswer.trim()) {
      setError("Please write your answer.");
      return;
    }

    setLoading(true);
    try {
      const res = await askQuestion({
        subject: formData.subject,
        topic: formData.topic,
        difficulty: formData.difficulty,
        questionText: formData.questionText,
        useAI: formData.useAI,
        manualAnswer: formData.useAI ? "" : formData.manualAnswer,
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaveLoading(true);
    try {
      await saveQuestion(result._id);
      setSaved(true);
    } catch (err) {
      console.log(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMarkSolved = async () => {
    if (!result) return;
    setMarkLoading(true);
    try {
      await updateQuestionStatus(result._id, "Solved");
      setMarked(true);
    } catch (err) {
      console.log(err);
    } finally {
      setMarkLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Ask Your Doubt</h1>
        <p className="text-gray-400 text-sm mb-8">
          Get AI-powered answers to your questions
        </p>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Form ── */}
          <div className="w-full lg:w-2/5 bg-white rounded-2xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Topic
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  disabled={!formData.subject}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition disabled:opacity-50"
                >
                  <option value="">Select topic</option>
                  {(TOPICS[formData.subject] || []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <option value="">Select difficulty</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Your Question
                </label>
                <textarea
                  name="questionText"
                  value={formData.questionText}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What is the difference between BFS and DFS?"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
                />
              </div>

              {/* AI or Manual toggle */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, useAI: true }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    formData.useAI
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  🤖 Ask AI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, useAI: false }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    !formData.useAI
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  ✍️ Write Myself
                </button>
              </div>

              {/* Manual answer box */}
              {!formData.useAI && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Your Answer
                  </label>
                  <textarea
                    name="manualAnswer"
                    value={formData.manualAnswer}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Write your answer here..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Getting answer..." : "Ask AI"}
              </button>
            </form>
          </div>

          {/* ── Right: AI Answer ── */}
          <div className="w-full lg:w-3/5 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-700 mb-4">AI Answer</h2>

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                <span className="text-5xl mb-3">💡</span>
                <p className="text-sm">Your answer will appear here</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Generating answer...</p>
              </div>
            )}

            {result && (
              <>
                {/* Answer text */}
                <div className="bg-indigo-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto mb-5">
                  {result.aiAnswer || result.manualAnswer || "No answer available."}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading || saved}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-60"
                  >
                    {saved ? "✅ Saved" : saveLoading ? "Saving..." : "🔖 Save Question"}
                  </button>
                  <button
                    onClick={handleMarkSolved}
                    disabled={markLoading || marked}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-60"
                  >
                    {marked ? "✅ Solved" : markLoading ? "Marking..." : "Mark as Solved"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AskDoubt;