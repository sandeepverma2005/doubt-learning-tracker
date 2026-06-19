import { Router } from "express";
import {
    askQuestion,
    saveQuestion,
    getSavedQuestions,
    getQuestionById,
    updateQuestionStatus,
    deleteQuestion,
    getQuestionsByFilter
} from "../controllers/question.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
 
const router = Router();
 
// Saare question routes secured hain — verifyJWT har route pe
router.use(verifyJWT);
 
// ── All questions with optional filters
// GET /api/v1/questions?subject=DSA&topic=Graphs&status=Solved
router.route("/").get(getQuestionsByFilter);
 
// ── Ask a new question ─
// POST /api/v1/questions/ask
router.route("/ask").post(askQuestion);
 
// ── Saved questions with optional filters ─
// GET /api/v1/questions/saved?subject=DSA&topic=Graphs&status=Solved
router.route("/saved").get(getSavedQuestions);
 

 
// ── Toggle save/unsave ─
// PATCH /api/v1/questions/save/:questionId
router.route("/save/:questionId").patch(saveQuestion);
 
// ── Update question status
// PATCH /api/v1/questions/status/:questionId
router.route("/status/:questionId").patch(updateQuestionStatus);
 
// ── Delete question 
// DELETE /api/v1/questions/:questionId
router.route("/:questionId")
.get(getQuestionById)
.delete(deleteQuestion);
 
export default router;