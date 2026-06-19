
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/question.model.js";
 import Groq from 'groq-sdk';
 import { Activity } from "../models/activity.model.js"; // Sahi path check kar lena
 const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────
// 1. ASK QUESTION  →  POST /api/v1/questions/ask
//    User question bhejta hai → AI answer generate hota hai
// ─────────────────────────────────────────────
const askQuestion = asyncHandler(async (req, res) => {
    const { subject, topic, difficulty, questionText } = req.body;

    // Validation
    if (!subject || !topic || !difficulty || !questionText) {
        throw new ApiError(400, "All fields are required");
    }

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
        throw new ApiError(400, "Difficulty must be Easy, Medium, or Hard");
    }

    let aiAnswer = "";

    try {
        // Groq API call
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `You are a helpful CS tutor. Answer this ${difficulty} level question on ${subject} - ${topic}: ${questionText}. Give a clear, concise explanation with examples if needed.`
                }
            ],
            model: "llama-3.3-70b-versatile", // Sahi model naam
        });

        aiAnswer = chatCompletion.choices[0]?.message?.content || "Could not generate answer.";
        
    } catch (error) {
        console.error("Groq Error:", error);
        aiAnswer = "AI service temporarily unavailable. Please try again later.";
    }

    // Save in DB
    const question = await Question.create({
        user: req.user._id,
        subject,
        topic,
        difficulty,
        questionText,
        aiAnswer,
        status: "Pending"
    });

     // ── Activity update (naya addition) ──────────
    const todayStr = new Date().toISOString().split("T")[0]; // "2025-06-08"
    await Activity.findOneAndUpdate(
        { user: req.user._id, date: todayStr },          // Aaj ka record dhundo
        { $addToSet: { topicsCovered: topic } },          // Topic add karo (duplicate nahi aayega)
        { upsert: true, new: true }                       // Nahi mila toh naya banao
    );
    // 

    return res
        .status(201)
        .json(new ApiResponse(201, question, "Question asked successfully"));
});
// ─────────────────────────────────────────────
// 2. SAVE QUESTION  →  PATCH /api/v1/questions/save/:questionId
//    Question ko saved list mein add/remove karo (toggle)
// ─────────────────────────────────────────────
const saveQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
 
    const question = await Question.findById(questionId);
 
    if (!question) {
        throw new ApiError(404, "Question not found");
    }
 
    // Sirf apna question save kar sakta hai
    if (question.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only save your own questions");
    }
 
    // Toggle: saved → unsaved, unsaved → saved
    question.isSaved = !question.isSaved;
    await question.save({ validateBeforeSave: false });
 
    const message = question.isSaved
        ? "Question saved successfully"
        : "Question removed from saved";
 
    return res
        .status(200)
        .json(new ApiResponse(200, question, message));
});
 
// ─────────────────────────────────────────────
// 3. GET SAVED QUESTIONS  →  GET /api/v1/questions/saved
//    Saved Questions page ka data
//    Filters: subject, topic, status (query params se)
// ─────────────────────────────────────────────
const getSavedQuestions = asyncHandler(async (req, res) => {
    const { subject, topic, status } = req.query;
 
    // Base filter: sirf is user ke saved questions
    const filter = {
        user: req.user._id,
        isSaved: true
    };
 
    // Optional filters (jo Saved Questions page pe hain)
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
 
    const savedQuestions = await Question.find(filter)
        .sort({ createdAt: -1 }); // Naye pehle
 
    return res
        .status(200)
        .json(new ApiResponse(200, savedQuestions, "Saved questions fetched successfully"));
});
 
// ─────────────────────────────────────────────
// 4. GET QUESTION BY ID  →  GET /api/v1/questions/:questionId
//    Ek specific question ka detail dekhna
// ─────────────────────────────────────────────
const getQuestionById = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
 
    const question = await Question.findById(questionId);
 
    if (!question) {
        throw new ApiError(404, "Question not found");
    }
 
    // Sirf apna question dekh sakta hai
    if (question.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to view this question");
    }
 
    return res
        .status(200)
        .json(new ApiResponse(200, question, "Question fetched successfully"));
});
 
// ─────────────────────────────────────────────
// 5. UPDATE QUESTION STATUS  →  PATCH /api/v1/questions/status/:questionId
//    Status update karo: Pending → Solved / Unsolved
//    Dashboard ke stats aur analytics ke liye zaroori
// ─────────────────────────────────────────────
const updateQuestionStatus = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { status } = req.body;

    // ... (purana validation wahi rahega) ...

    const question = await Question.findById(questionId);
    if (!question) throw new ApiError(404, "Question not found");

    // Status change karo
    const oldStatus = question.status;
    question.status = status;
    await question.save({ validateBeforeSave: false });

    // ANALYTICS LOGIC: Agar naya status "Solved" hai
    if (status === "Solved" && oldStatus !== "Solved") {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        await Activity.findOneAndUpdate(
            { user: req.user._id, date: today },
            { 
                $inc: { questionsSolved: 1 }, 
                $addToSet: { topicsCovered: question.topic } 
            },
            { upsert: true, new: true }
        );
    }

    return res.status(200).json(new ApiResponse(200, question, "Question status updated"));
});
 
// ─────────────────────────────────────────────
// 6. DELETE QUESTION  →  DELETE /api/v1/questions/:questionId
//    Question permanently delete karo
// ─────────────────────────────────────────────
const deleteQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
 
    const question = await Question.findById(questionId);
 
    if (!question) {
        throw new ApiError(404, "Question not found");
    }
 
    // Sirf apna question delete kar sakta hai
    if (question.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this question");
    }
 
    await Question.findByIdAndDelete(questionId);
 
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Question deleted successfully"));
});
 
// ─────────────────────────────────────────────
// 7. GET QUESTIONS BY FILTER  →  GET /api/v1/questions
//    Sab questions with optional filters
//    (Subject, Topic, Difficulty, Status — query params)
// ─────────────────────────────────────────────
const getQuestionsByFilter = asyncHandler(async (req, res) => {
    const { subject, topic, difficulty, status } = req.query;
 
    const filter = { user: req.user._id };
 
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
 
    const questions = await Question.find(filter)
        .sort({ createdAt: -1 });
 
    return res
        .status(200)
        .json(new ApiResponse(200, questions, "Questions fetched successfully"));
});
 
export {
    askQuestion,
    saveQuestion,
    getSavedQuestions,
    getQuestionById,
    updateQuestionStatus,
    deleteQuestion,
    getQuestionsByFilter
};