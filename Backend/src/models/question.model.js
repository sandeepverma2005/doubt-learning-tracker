import mongoose, { Schema } from "mongoose";
 
const questionSchema = new Schema(
    {
        // Kis user ne question pucha
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
 
        // Subject — e.g. "Data Structures & Algorithms", "Operating Systems"
        subject: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
 
        // Topic — e.g. "Graphs", "Trees", "DP"
        topic: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
 
        // Difficulty level
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },
 
        // User ka actual question
        questionText: {
            type: String,
            required: true,
            trim: true
        },
 
        // Claude AI ka answer
        aiAnswer: {
            type: String,
            default: ""
        },
 
        // Question ka status — dashboard aur analytics ke liye
        status: {
            type: String,
            enum: ["Pending", "Solved", "Unsolved"],
            default: "Pending",
            index: true
        },
 
        // Saved Questions page ke liye
        isSaved: {
            type: Boolean,
            default: false,
            index: true
        },
        manualAnswer: {
    type: String,
    default: ""
},
useAI: {
    type: Boolean,
    default: true
}
    },
    {
        timestamps: true  // createdAt → streak & activity graph ke liye use hoga
    }
);
 
export const Question = mongoose.model("Question", questionSchema);