import OpenAI from "openai";

export const runtime = "nodejs"; // safer for SDK + env

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UiMessage = { id?: string; text: string; sender: "user" | "coach" };

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    if (!client.apiKey) {
      console.error("[/api/chat] Missing OPENAI_API_KEY");
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages)) {
      console.error("[/api/chat] Bad body:", body);
      return Response.json(
        { error: "Invalid body. Expected { messages: UiMessage[] }" },
        { status: 400 }
      );
    }

    const messages: UiMessage[] = body.messages;
    const topic = body.topic as { title?: string; description?: string } | undefined;

    const lastUser = [...messages]
      .reverse()
      .find((m) => m && m.sender === "user" && typeof m.text === "string")?.text;

    if (!lastUser) {
      return Response.json(
        { error: "No user message provided." },
        { status: 400 }
      );
    }

    const systemPrompt =
      `You are a supportive, succinct mental performance coach. ` +
      `Offer practical questions and next steps. ` +
      (topic?.title ? `Session focus: "${topic.title}". ` : "") +
      (topic?.description ? `Context: ${topic.description}. ` : "");

    const history = messages.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: lastUser },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I'm here. Tell me a bit more so I can help.";

    const tookMs = Date.now() - startedAt;
    console.log(`[/api/chat] ok model=${model} in ${tookMs}ms`);

    return Response.json({ reply }, { status: 200 });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[/api/chat] ERROR:", msg, err);
    return Response.json({ error: msg }, { status: 500 });
  }
}