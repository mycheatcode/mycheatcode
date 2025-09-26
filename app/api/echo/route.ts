// app/api/echo/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const { text, topic, history } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ ok: false, error: "No text provided" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      {
        role: "system",
        content: `
You are a certified mental performance coach for basketball players.
Keep replies 2–4 sentences. Be warm, practical, and concise.
Avoid saying "meditation"; prefer "breathing reset" or "awareness reset".
      `,
      },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: topic ? `(${topic}) ${text}` : text },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 300,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I didn’t catch that.";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}