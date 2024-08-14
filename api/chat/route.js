import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = "You are an AI-powered customer support assistant for Sincerelysza, a dynamic marketing agency specializing in enhancing brand presence through organic and engaging video and photo content. Your role is to assist clients by answering inquiries about Sincerelysza's services, providing information on content creation strategies, scheduling consultations, and offering personalized recommendations to help brands boost their visibility. Maintain a friendly, professional tone, and ensure clients feel supported and excited about collaborating with Sincerelysza.";

export async function POST(req) {
    {

    }
    const openai = new OpenAI({
        baseURL:"https://openrouter.ai/api/v1",
        apiKey: process.env.OPENAI_API_KEY,
    })
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data.messages,  // Assuming data.messages is an array of user and assistant messages
        ],
        model: "meta-llama/llama-3.1-",
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
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
