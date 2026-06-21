import axios from "axios";

// Dynamic Base URL setup (Vite env se check karega)
const BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1` 
    : "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // cookies (JWT) ke liye zaroori
});

// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Har request se pehle localStorage se
// accessToken leke Authorization header mein lagao
// ─────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Agar 401 aaye (token expire) toh
// refresh token se naya access token lo
// ─────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 aaya aur retry nahi kiya abhi tak
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // ✅ Yahan humne BASE_URL use kar liya taaki live par Render wala URL hi use ho
                const res = await axios.post(
                    `${BASE_URL}/users/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const newToken = res.data.data.accessToken;
                localStorage.setItem("accessToken", newToken);

                // Naye token ke saath original request dobara bhejo
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                // Refresh bhi fail — logout karo
                console.log(err);
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const registerUser = (formData) =>
    api.post("/users/register", formData);

export const loginUser = (data) =>
    api.post("/users/login", data);

export const logoutUser = () =>
    api.post("/users/logout");

export const getCurrentUser = () =>
    api.get("/users/current-user");

export const refreshToken = () =>
    api.post("/users/refresh-token");

export const changePassword = (data) =>
    api.post("/users/change-password", data);

export const updateAccount = (data) =>
    api.patch("/users/update-account", data);

export const updateAvatar = (formData) =>
    api.patch("/users/avatar", formData);

// ─────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────
export const askQuestion = (data) =>
    api.post("/questions/ask", data);

export const getSavedQuestions = (params) =>
    api.get("/questions/saved", { params });

export const getQuestionsByFilter = (params) =>
    api.get("/questions", { params });

export const getQuestionById = (questionId) =>
    api.get(`/questions/${questionId}`);

export const saveQuestion = (questionId) =>
    api.patch(`/questions/save/${questionId}`);

export const updateQuestionStatus = (questionId, status) =>
    api.patch(`/questions/status/${questionId}`, { status });

export const deleteQuestion = (questionId) =>
    api.delete(`/questions/${questionId}`);

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
export const getDashboardStats = () =>
    api.get("/analytics/dashboard");

export const getCurrentStreak = () =>
    api.get("/analytics/streak");

export const getSubjectAnalytics = () =>
    api.get("/analytics/subjects");

export const getTopicAnalytics = (params) =>
    api.get("/analytics/topics", { params });

export const getSolvedVsUnsolved = () =>
    api.get("/analytics/solved-unsolved");

export const getDailyActivityGraph = (days = 7) =>
    api.get("/analytics/daily-activity", { params: { days } });

export const getWeakTopics = () =>
    api.get("/analytics/weak-topics");

export default api;