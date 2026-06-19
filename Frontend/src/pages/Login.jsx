import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(formData);
   const { accessToken, user } = res.data.data;
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* ── Left: Illustration ── */}
        <div className="hidden md:flex w-1/2 bg-indigo-600 flex-col items-center justify-center p-10 text-white">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="text-3xl font-bold mb-3">StudyMate AI</h2>
          <p className="text-indigo-200 text-center text-sm leading-relaxed">
            Your personal AI-powered doubt solver. Ask questions, track
            progress, and master every topic.
          </p>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-10">
            <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="w-full md:w-1/2 p-10">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Welcome Back 👋
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Login to continue your learning journey
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <p className="text-right mt-1">
                <span className="text-xs text-indigo-500 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-medium hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;