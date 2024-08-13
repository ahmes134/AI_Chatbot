import { NextResponse } from "next/server";
import axios from "axios";

const systemPrompt = "You are an AI-powered customer support assistant for Sincerelysza, a dynamic marketing agency specializing in enhancing brand presence through organic and engaging video and photo content. Your role is to assist clients by answering inquiries about Sincerelysza's services, providing information on content creation strategies, scheduling consultations, and offering personalized recommendations to help brands boost their visibility. Maintain a friendly, professional tone, and ensure clients feel supported and excited about collaborating with Sincerelysza.";

export async function POST(req) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const data = await req.json();

    const response = await axios.post(
        'https://api.openrouter.ai/models/meta-llama/llama-3.1-8b-instruct:free/activity',
        {
            prompt: systemPrompt + "\n" + data.messages.map(msg => msg.content).join("\n"), // Combine system prompt and messages
            max_tokens: 100,
            temperature: 0.7,
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const content = response.data.choices[0]?.text;
                if (content) {
                    const text = encoder.encode(content);
                    controller.enqueue(text);
                }
            } catch (err) {
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
