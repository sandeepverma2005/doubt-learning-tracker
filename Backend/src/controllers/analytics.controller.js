import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/question.model.js";
import { Activity } from "../models/activity.model.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// 1. GET DASHBOARD STATS  →  GET /api/v1/analytics/dashboard
// ─────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // ── Part 1: Basic counts ──────────────────
    const basicStats = await Question.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: null,
                totalQuestions: { $sum: 1 },
                solvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] }
                },
                pendingQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
                }
            }
        },
        { $project: { _id: 0, totalQuestions: 1, solvedQuestions: 1, pendingQuestions: 1 } }
    ]);

    // ── Part 2: Topic Distribution (pie chart) ─
    const topicDistribution = await Question.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$topic", count: { $sum: 1 } } },
        {
            $lookup: {
                from: "questions",
                pipeline: [
                    { $match: { user: userId } },
                    { $count: "total" }
                ],
                as: "totalData"
            }
        },
        {
            $project: {
                _id: 0,
                topic: "$_id",
                count: 1,
                percentage: {
                    $round: [
                        {
                            $multiply: [
                                { $divide: ["$count", { $arrayElemAt: ["$totalData.total", 0] }] },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // ── Part 3: Recent Activity (last 5 questions) ─
    const recentActivity = await Question.aggregate([
        { $match: { user: userId } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { _id: 1, topic: 1, questionText: 1, status: 1, createdAt: 1 } }
    ]);

    // ── Part 4: Current Streak — Activity model se ─
    const streakData = await calculateStreak(userId);

    const stats = basicStats[0] || {
        totalQuestions: 0,
        solvedQuestions: 0,
        pendingQuestions: 0
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentStreak: streakData.currentStreak,
                totalQuestions: stats.totalQuestions,
                solvedQuestions: stats.solvedQuestions,
                pendingQuestions: stats.pendingQuestions,
                topicDistribution,
                recentActivity
            },
            "Dashboard stats fetched successfully"
        )
    );
});

// ─────────────────────────────────────────────
// HELPER: CALCULATE STREAK — Activity model se
//    Activity mein har din ka record hai
//    Consecutive days count karo
// ─────────────────────────────────────────────
const calculateStreak = async (userId) => {
    // Activity collection se user ke saare dates nikalo (latest pehle)
    const activities = await Activity.find(
        { user: userId },
        { date: 1, _id: 0 }
    ).sort({ date: -1 }); // Latest date pehle

    if (activities.length === 0) {
        return { currentStreak: 0 };
    }

    const dates = activities.map((a) => a.date); // ["2025-06-08", "2025-06-07", ...]

    let streak = 0;
    const today = new Date().toISOString().split("T")[0]; // "2025-06-08"

    for (let i = 0; i < dates.length; i++) {
        // Expected date: aaj se i din pehle
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedStr = expectedDate.toISOString().split("T")[0];

        if (dates[i] === expectedStr) {
            streak++;
        } else {
            // Chain toot gayi
            break;
        }
    }

    return { currentStreak: streak };
};

// ─────────────────────────────────────────────
// 2. GET SUBJECT ANALYTICS  →  GET /api/v1/analytics/subjects
// ─────────────────────────────────────────────
const getSubjectAnalytics = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const subjectAnalytics = await Question.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: "$subject",
                totalQuestions: { $sum: 1 },
                solvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] }
                },
                unsolvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Unsolved"] }, 1, 0] }
                },
                pendingQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                subject: "$_id",
                totalQuestions: 1,
                solvedQuestions: 1,
                unsolvedQuestions: 1,
                pendingQuestions: 1
            }
        },
        { $sort: { totalQuestions: -1 } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, subjectAnalytics, "Subject analytics fetched successfully")
    );
});

// ─────────────────────────────────────────────
// 3. GET TOPIC ANALYTICS  →  GET /api/v1/analytics/topics
// ─────────────────────────────────────────────
const getTopicAnalytics = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const { subject } = req.query;

    const matchStage = { user: userId };
    if (subject) matchStage.subject = subject;

    const topicAnalytics = await Question.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { topic: "$topic", subject: "$subject" },
                totalQuestions: { $sum: 1 },
                solvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] }
                },
                unsolvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Unsolved"] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                topic: "$_id.topic",
                subject: "$_id.subject",
                totalQuestions: 1,
                solvedQuestions: 1,
                unsolvedQuestions: 1
            }
        },
        { $sort: { totalQuestions: -1 } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, topicAnalytics, "Topic analytics fetched successfully")
    );
});

// ─────────────────────────────────────────────
// 4. GET SOLVED VS UNSOLVED  →  GET /api/v1/analytics/solved-unsolved
// ─────────────────────────────────────────────
const getSolvedVsUnsolved = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const result = await Question.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                solved: { $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] } },
                unsolved: { $sum: { $cond: [{ $eq: ["$status", "Unsolved"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                solved: 1,
                unsolved: 1,
                pending: 1,
                solvedPercentage: {
                    $round: [{ $multiply: [{ $divide: ["$solved", "$total"] }, 100] }, 1]
                },
                unsolvedPercentage: {
                    $round: [{ $multiply: [{ $divide: ["$unsolved", "$total"] }, 100] }, 1]
                }
            }
        }
    ]);

    const data = result[0] || {
        total: 0, solved: 0, unsolved: 0, pending: 0,
        solvedPercentage: 0, unsolvedPercentage: 0
    };

    return res.status(200).json(
        new ApiResponse(200, data, "Solved vs Unsolved data fetched successfully")
    );
});

// ─────────────────────────────────────────────
// 5. GET DAILY ACTIVITY GRAPH  →  GET /api/v1/analytics/daily-activity
//    Ab Activity model se aayega — questionsSolved aur topicsCovered
//    Query param: ?days=7 (default 7, max 30)
// ─────────────────────────────────────────────
const getDailyActivityGraph = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const days = Math.min(parseInt(req.query.days) || 7, 30);

    // Start date calculate karo
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0]; // "2025-06-01"

    // Activity model se fetch karo — date string compare hoga
    const activities = await Activity.find(
        {
            user: userId,
            date: { $gte: startDateStr } // String comparison — YYYY-MM-DD format mein sahi kaam karta hai
        },
        { date: 1, questionsSolved: 1, topicsCovered: 1, _id: 0 }
    ).sort({ date: 1 }); // Purani date pehle

    // Gaps fill karo — jo din koi activity nahi tha woh bhi include karo
    const filledData = [];
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split("T")[0];

        const found = activities.find((a) => a.date === dateStr);
        filledData.push(
            found
                ? {
                    date: found.date,
                    questionsSolved: found.questionsSolved,
                    topicsCovered: found.topicsCovered
                  }
                : {
                    date: dateStr,
                    questionsSolved: 0,
                    topicsCovered: []
                  }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, filledData, "Daily activity graph data fetched successfully")
    );
});

// ─────────────────────────────────────────────
// 6. GET WEAK TOPICS  →  GET /api/v1/analytics/weak-topics
// ─────────────────────────────────────────────
const getWeakTopics = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const weakTopics = await Question.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: "$topic",
                subject: { $first: "$subject" },
                totalQuestions: { $sum: 1 },
                solvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] }
                },
                unsolvedQuestions: {
                    $sum: { $cond: [{ $eq: ["$status", "Unsolved"] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                topic: "$_id",
                subject: 1,
                totalQuestions: 1,
                solvedQuestions: 1,
                unsolvedQuestions: 1,
                solveRate: {
                    $round: [
                        { $multiply: [{ $divide: ["$solvedQuestions", "$totalQuestions"] }, 100] },
                        1
                    ]
                }
            }
        },
        {
            $match: {
                solveRate: { $lt: 50 },
                totalQuestions: { $gte: 2 }
            }
        },
        { $sort: { solveRate: 1 } },
        { $limit: 5 }
    ]);

    return res.status(200).json(
        new ApiResponse(200, weakTopics, "Weak topics fetched successfully")
    );
});

// ─────────────────────────────────────────────
// 7. GET CURRENT STREAK  →  GET /api/v1/analytics/streak
// ─────────────────────────────────────────────
const getCurrentStreak = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const streakData = await calculateStreak(userId);

    return res.status(200).json(
        new ApiResponse(200, streakData, "Current streak fetched successfully")
    );
});

export {
    getDashboardStats,
    getSubjectAnalytics,
    getTopicAnalytics,
    getSolvedVsUnsolved,
    getDailyActivityGraph,
    getWeakTopics,
    getCurrentStreak
};