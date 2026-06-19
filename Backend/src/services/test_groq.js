import 'dotenv/config';
import Groq from 'groq-sdk';

// GROQ_API_KEY aapki .env file se load ho rahi hai
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  try {
    console.log("Groq se connect ho raha hai...");
    
  const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": "Hello! Kya aap mujhe sun sakte hain? Ek chota sa test response dein."
        }
      ],
      "model": "llama-3.3-70b-versatile", // Naya model name
    });

    console.log("--- GROQ KA JAWAB ---");
    console.log(chatCompletion.choices[0]?.message?.content);
    
  } catch (error) {
    console.error("Error details:", error.message);
  }
}

testGroq();