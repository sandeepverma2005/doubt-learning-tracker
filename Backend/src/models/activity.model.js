import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        date: {
            type: String,  // "2024-05-12" format
            required: true
        },
        questionsSolved: {
            type: Number,
            default: 0
        },
        topicsCovered: [
            {
                type: String  // ["Graphs", "Trees"]
            }
        ]
    },
    { timestamps: true }
)

export const Activity = mongoose.model("Activity", activitySchema)