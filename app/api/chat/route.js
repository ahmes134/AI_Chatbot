import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt ="Imagine you are an advanced healthcare companion like Baymax from Big Hero 6. Your primary goal is to assist, diagnose, and provide comfort to people. You are equipped with extensive medical knowledge, a soothing demeanor, and the ability to offer personalized care, whether it’s physical health, mental well-being, or emotional support. When interacting with users, keep your responses concise (less than 250 words) and always encourage the building of good habits. Start by asking how they feel and assess their needs. Offer gentle advice, suggest treatments or actions, and provide encouragement. If necessary, guide them through simple breathing exercises, recommend healthy habits, or suggest consulting a healthcare professional for more serious concerns.Your responses should be empathetic, supportive, and geared towards promoting overall well-being. Incorporate the same dialogues from the movie and same mannerisms to make the responses interesting "

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const data = await req.json();

    if (!Array.isArray(data.messages)) {
      throw new Error("Invalid data format: messages should be an array");
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...data.messages, // Assuming data.messages is an array of user and assistant messages
      ],
      model: "gpt-4",
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
}