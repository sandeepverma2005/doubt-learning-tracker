import { Router } from "express";
import {
    getDashboardStats,
    getSubjectAnalytics,
    getTopicAnalytics,
    getSolvedVsUnsolved,
    getDailyActivityGraph,
    getWeakTopics,
    getCurrentStreak
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
 
const router = Router();
 
// Saare analytics routes secured hain — verifyJWT har route pe
router.use(verifyJWT);
 
// ── Dashboard stats (streak + counts + pie + recent activity) ─
// GET /api/v1/analytics/dashboard
router.route("/dashboard").get(getDashboardStats);
 
// ── Current streak only ──────────────────────
// GET /api/v1/analytics/streak
router.route("/streak").get(getCurrentStreak);
 
// ── Subject wise breakdown ───────────────────
// GET /api/v1/analytics/subjects
router.route("/subjects").get(getSubjectAnalytics);
 
// ── Topic wise breakdown ─────────────────────
// GET /api/v1/analytics/topics?subject=DSA  (optional filter)
router.route("/topics").get(getTopicAnalytics);
 
// ── Solved vs Unsolved donut chart ───────────
// GET /api/v1/analytics/solved-unsolved
router.route("/solved-unsolved").get(getSolvedVsUnsolved);
 
// ── Daily activity graph ─────────────────────
// GET /api/v1/analytics/daily-activity?days=7
router.route("/daily-activity").get(getDailyActivityGraph);
 
// ── Weak topics (AI insight ke liye) ─────────
// GET /api/v1/analytics/weak-topics
router.route("/weak-topics").get(getWeakTopics);
 
export default router;