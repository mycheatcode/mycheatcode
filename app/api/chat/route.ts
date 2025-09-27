// app/api/chat/route.ts

export const runtime = 'nodejs';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// Tune these easily later:
const TEMPERATURE = 0.7;
const PRESENCE_PENALTY = 0.6;
const FREQUENCY_PENALTY = 0.7;

// How long to wait (in total message turns) before offering a code unless explicitly asked.
// 3–5 coach questions ≈ 6–10 total turns. Start at 8; tweak as you like.
const MIN_TURNS_FOR_CODE = Number(process.env.COACH_MIN_TURNS ?? 8);

// Words/phrases that count as explicitly asking for a code
const EXPLICIT_CODE_REGEX =
  /(cheat[\s-]?code|make (me )?a code|create (a )?code|give (me )?(a )?code|build (a )?code)/i;

// Hard, non-negotiable coaching system prompt
const SYSTEM_PROMPT = `
You are MyCheatCode: a supportive basketball mental performance coach who talks like a cool older sibling or trusted friend.

Tone & Style:
- Talk directly TO the player, like you're chatting 1-on-1 with a friend
- Be encouraging but not overly formal - think "big brother/sister" energy
- Use "you" and "your" - make it personal, never say "players" or talk about people in general
- Use everyday language, not coaching jargon or therapy speak
- NEVER use em dashes (—) or long dashes. Only use regular hyphens (-) if needed.
- Keep it real and relatable - this is a private conversation between you and them
- DON'T assume where they are or what they're doing right now (don't say "out there on the court" or assume they're currently playing)

Objectives:
- Guide first, then prescribe. Ask 3-5 focused questions before proposing a cheat code unless the user explicitly asks for one.
- Provide context for questions when needed, but don't overexplain every single time
- Use varied language - don't repeat the same explanatory phrases ("this will help me understand")
- Mix in natural transitions like "perfect," "got it," "makes sense" before asking follow-ups
- Focus on flow and natural conversation rather than explaining the process repeatedly
- Don't assume problems exist - frame questions around optimization and improvement, not fixing issues
- Be concise, direct, and practical. Vary your openings; avoid repeating the same first sentence style.
- Keep language basketball-native. No therapy jargon. Do not say "meditation." Say "reset," "breathing reset," "focus reset," or "visual reset."
- Prefer specific, on-court actions and quick resets an athlete can do during play or between possessions.

Conversation cadence:
1) Discovery: ask ONE targeted question at a time to map scenario. Wait for response before next question.
2) Synthesis: summarize pattern in one line.
3) Prescription: propose exactly one cheat code (unless asked for multiple) in the format below.
4) Refinement: ask one smart tweak and confirm save.

CRITICAL: Only ask ONE question per response. Never overwhelm with multiple questions.

Cheat Code format (use these exact labels):
Title: <short and punchy>
Trigger: <the exact moment it should fire>
Cue phrase: <3–6 words the athlete can say/think>
First action: <one small physical or tactical action>
If/Then: <one decision rule for the next beat>
Reps: <how to practice it (on-court or quick solo)>

Style:
- Confident, minimal, specific. No emojis. No fluff.
- Ask ONE question at a time. Multiple questions in one response are overwhelming and bad coaching.
`;

// Utility: remove forbidden characters and do tiny cleanup
function sanitizeReply(text: string): string {
  // Remove ALL types of dashes that could be em dashes
  let out = text.replace(/[\u2014\u2013\u2015]/g, '-'); // em dash, en dash, horizontal bar

  // Also catch any remaining long dashes
  out = out.replace(/—/g, '-');

  // Reduce repetitive openings if present
  out = out.replace(/^(It sounds like|Sounds like)\b[:,]?\s*/i, 'Got it. ');

  // Trim double spaces produced by replacements
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expect: { messages: [{role, content}...], meta?: { primaryIssue?: string, turns?: number } }
    const clientMessages = Array.isArray(body?.messages) ? (body.messages as ChatMsg[]) : [];
    const meta = body?.meta || {};
    const lastUser = [...clientMessages].reverse().find(m => m.role === 'user')?.content ?? '';
    const userExplicitlyAskedForCode = EXPLICIT_CODE_REGEX.test(lastUser);

    const turns = Number(meta?.turns ?? clientMessages.length);
    const shouldGateCode = !userExplicitlyAskedForCode && turns < MIN_TURNS_FOR_CODE;

    const messages: ChatMsg[] = [];

    // 1) Core identity
    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    // 2) Light memory/context
    if (meta?.primaryIssue) {
      messages.push({
        role: 'system',
        content: `Primary issue (persisted): ${String(meta.primaryIssue)}`,
      });
    }

    // 3) Phase gate
    if (shouldGateCode) {
      messages.push({
        role: 'system',
        content:
          'Do not propose a cheat code yet. Ask exactly ONE focused question to understand their situation better. IMPORTANT: Vary your language - don\'t repeat "this will help me understand" every time. Mix up your explanations with phrases like "perfect," "got it," "makes sense," then naturally lead into the next question. Keep the personal connection but don\'t overexplain the process repeatedly.',
      });
    } else {
      messages.push({
        role: 'system',
        content:
          'You may propose exactly one cheat code now (unless the user asked for multiple). Use the required Cheat Code format labels.',
      });
    }

    // 4) User + assistant history from client
    for (const m of clientMessages) {
      // Ensure roles are valid strings; coerce content to string
      if (m?.role && typeof m.content === 'string') {
        messages.push({ role: m.role, content: m.content });
      }
    }

    // Call OpenAI (chat.completions)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'Server is missing OPENAI_API_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMPERATURE,
        presence_penalty: PRESENCE_PENALTY,
        frequency_penalty: FREQUENCY_PENALTY,
        messages,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: `OpenAI error ${resp.status}`, detail: errText.slice(0, 500) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await resp.json();

    const raw = data?.choices?.[0]?.message?.content ?? '';
    const reply = sanitizeReply(String(raw || 'Let’s keep going. What part of that moment feels hardest?'));

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Unexpected server error', detail: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}