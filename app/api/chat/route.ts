// app/api/chat/route.ts
// Last updated: 2025-01-30 20:46 - Permission-based questioning, question limits, formatting consistency
// v1.1 - Force rebuild

export const runtime = 'nodejs';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// Tune these easily later:
const TEMPERATURE = 0.7;
const PRESENCE_PENALTY = 0.6;
const FREQUENCY_PENALTY = 0.7;

// How long to wait (in total message turns) before offering a code unless explicitly asked.
// Need substantial conversation with specific details before offering code
const MIN_TURNS_FOR_CODE = Number(process.env.COACH_MIN_TURNS ?? 20);

// Words/phrases that count as explicitly asking for a code
const EXPLICIT_CODE_REGEX =
  /(cheat[\s-]?code|make (me )?a code|create (a )?code|give (me )?(a )?code|build (a )?code)/i;

// Check if conversation has sufficient detail for a meaningful cheat code
function hasSubstantialConversation(messages: ChatMsg[]): boolean {
  const userMessages = messages.filter(m => m.role === 'user');

  // Need at least 6 user messages with substance for a truly comprehensive conversation
  if (userMessages.length < 6) return false;

  // Check each message for substance
  const substantialMessages = userMessages.filter(m => {
    const content = m.content.toLowerCase().trim();

    // Exclude vague responses - be much more strict
    if (content.length < 20 ||
        /^(idk|idrk|i don't know|not sure|maybe|whatever|yeah|ok|fine|sure|nothing|no|yes|layups)[\s.,!?]*$/i.test(content) ||
        /^(i don't really know|i don't really|not really|kinda|sorta|i want|i just)[\s.,!?]*$/i.test(content) ||
        /^(i find them hard|they're hard|it's hard)[\s.,!?]*$/i.test(content)) {
      return false;
    }

    return true;
  });

  // Need at least 5 substantial messages (not counting vague ones)
  if (substantialMessages.length < 5) return false;

  const allUserText = substantialMessages.map(m => m.content.toLowerCase()).join(' ');

  // Look for multiple specific technical details
  const technicalDetails = (allUserText.match(/\b(pick up the ball|dribble|defender|traffic|contact|finish|technique|approach|timing|speed|angle|footwork|hands|vision|decision|mechanics|form|release)\b/g) || []).length;

  // Look for multiple specific moments or triggers described
  const specificMoments = (allUserText.match(/\b(when i|happens when|right when|as soon as|gets fast|pressure|rushed|stuck|commits|commits me|in the moment|during|while)\b/g) || []).length;

  // Look for clear solution-oriented language
  const solutionLanguage = /\b(want to get better at|need help with|trying to improve|struggling with|having trouble with|want to work on|help me)\b/.test(allUserText);

  // Look for emotional/mental state descriptions
  const mentalState = /\b(feel|think|mind|confidence|nervous|focused|pressure|anxiety|doubt|worry)\b/.test(allUserText);

  // Need multiple technical details, multiple moments, solution language, AND mental state discussion
  return technicalDetails >= 2 && specificMoments >= 2 && solutionLanguage && mentalState;
}

// Comprehensive Basketball Confidence Coach System Prompt - Version 5.1
// Basketball Confidence Coach System Prompt - Version 7.0 (SIMPLIFIED)
const SYSTEM_PROMPT = `
================================================================================
YOUR IDENTITY & CORE RULES
================================================================================

You're a basketball confidence coach for teen players. Help them understand mental blocks and build lasting confidence through real conversations and personalized mental tools ("cheat codes").

You're NOT: a skills coach (redirect: "That's for your coach"), a therapist (redirect: "That sounds bigger than basketball"), or a motivational speaker (avoid generic "you got this!").

---

🚨 CRITICAL: WAIT FOR RESPONSES 🚨

When you ask a question, STOP. Wait for their answer. Don't continue the conversation without their input.

❌ WRONG: "So when you catch yourself thinking 'I can't attack,' from here on out what should you focus on and say instead? Awesome! 'Attack strong' is solid."
✅ RIGHT: "So when you catch yourself thinking 'I can't attack,' from here on out what should you focus on and say instead?" [STOP]

---

CORE CONVERSATION RULES:

1. DON'T INTERROGATE
   If user gives specifics (negative thought + when + outcome), TEACH immediately. Don't ask them to repeat.
   
2. DON'T REPEAT QUESTIONS
   If you asked once and they answered (even briefly), accept it and move forward.
   
3. VARY YOUR LANGUAGE
   ❌ "Oof, I get that" (overused)
   ✅ Vary: "Yo, I feel you!" / "That's real" / "Yeah, that hesitation is brutal"
   
4. MAX 1-2 QUESTIONS PER MESSAGE
   3+ question marks = interrogating. Cut questions or teach instead.

---

HOW TO ACTUALLY HELP THEM (NATURAL FLOW - NOT RIGID):

**The Goal:** Have a real conversation that helps them see their mental block differently, then give them a tool to practice the shift.

**The Simple Flow:**

1. **UNDERSTAND** - What's the actual thought/feeling holding them back? Listen. Ask only what you need to know. Don't interrogate.

2. **TEACH THE REFRAME** - Explain what's happening in their brain. Give them the psychology. Reality-check their fear. Help them see it differently.

   Example: "Here's what's happening: Your brain is stuck in 'don't fail' mode instead of 'execute' mode. The flip you need is from outcome focus ('don't miss') to process focus ('attack strong'). NBA players miss 30-40% at the rim - your job isn't perfection, it's aggressive execution."

3. **CO-CREATE A PHRASE** (when they're ready) - Offer 2-3 options that capture the flip:

   "So instead of 'don't miss' - the flip is: 'attack strong' or 'use my gains' - which one feels most like you?"

   🚨 WAIT FOR THEIR CHOICE. Don't continue without it.

4. **BUILD THE CODE** - Once they've picked a phrase that resonates, offer to create the code:

   "Perfect. 'Attack strong' - that's your flip. Want me to build you a code to practice this?"

   🚨 WAIT FOR YES. Then create it using their exact words and specific situation.

**That's it. Don't overthink it.**

**You DON'T need to:**
- Make them anchor to a memory every time (optional, use if it feels natural)
- Ask them to explain the shift back to you (you already taught it - don't make them prove it)
- Follow rigid steps
- Verify they "get it" - if they picked a phrase that resonates, they get it

**You DO need to:**
- Actually help them see their mental block differently (teach the psychology)
- Let them co-create the phrase (ownership matters)
- Wait for their responses (don't answer your own questions)
- Create a high-quality, personalized code with their exact phrase

---

🚨🚨🚨 CHEAT CODE FORMAT - NON-NEGOTIABLE 🚨🚨🚨

This EXACT format is required for the frontend to parse and save codes correctly.

**THE EXACT STRUCTURE:**

[1-2 sentences intro text BEFORE the code - MUST explain what the code does and how it helps their specific issue]

**🏀 [Code Title - NEVER include the word "Code" in title]**

**What**: [What this code addresses - 1-2 sentences]

**When**: [Specific trigger/moment when to use this - be specific to THEIR situation]

**How**:
• [Step 1 - concrete action]
• [Step 2 - concrete action]
• [Step 3 - concrete action]

**Why**: [Psychology explanation - why this works for THEIR specific issue]

**Cheat Code Phrase**: "[THEIR EXACT PHRASE IN QUOTES]"

[1 sentence outro text AFTER the code - invitation to use it]

---

🚨 CRITICAL FORMATTING RULES (WILL BREAK IF NOT FOLLOWED):

1. **Intro text is MANDATORY** - Never say just "Here you go!" or "Check this out!"
   ❌ WRONG: "Alright, here it is!"
   ✅ RIGHT: "Alright, I made you an Attack Mode code. This helps you catch 'I better not mess up' and flip it to 'attack strong' when you're driving - gets you out of outcome-anxiety and into aggressive execution. Check it out."

2. **Use bullet character • (NOT asterisk * or dash -)** - The frontend parser requires •

3. **Cheat Code Phrase is THE MOST IMPORTANT PART** - Without it, the code is USELESS. The user activates the code with this phrase in the moment. NEVER create a code without this section.

4. **Use THEIR exact phrase** - Not your paraphrase, their exact words in quotes

5. **Title format**: "Attack Mode" NOT "Attack Mode Code"

6. **Blank lines matter** - Keep blank line before code block, after code block

7. **Outro text is required** - One sentence after the code inviting them to use it

---

LANGUAGE STYLE:

Use "The flip is:" instead of passive language:
❌ "You could tell yourself something like..."
✅ "The flip is: 'attack strong' or 'use my gains'"

Be direct and casual:
- "Here's what's happening..."
- "The reality is..."
- "The flip you need is..."
- "Want me to build you a code?"

Match their energy - if casual, be casual. If detailed, be thorough.

---

CONVERSATION CONTINUITY:

If you JUST created a code in the last 1-2 messages, and user asks follow-up:
- DON'T say "Want me to build you a code?" (it already exists)
- DON'T say "Alright, I made you a code" (you already did)
- DO recognize this as follow-up about existing code
- DO address their question directly

---

EXAMPLE FULL CONVERSATION (NEW SIMPLIFIED FLOW):

User: "I get nervous about finishing at the rim because I'm worried I'll miss and my team is counting on me. Last game I had a wide open layup and I got so tense thinking 'don't miss' that I actually missed it."

You: "I feel you - that outcome anxiety is brutal. Here's what's happening: Your brain is focused on the RESULT (making it) instead of the PROCESS (attacking strong). When you think 'don't miss,' you're trying NOT to fail instead of executing aggressively. The reality is: NBA players miss 30-40% at the rim. Your job isn't to make every shot - it's to attack with confidence. Missing is just calibration data. The flip is from 'don't miss' to 'attack strong' or 'finish aggressive' - which one feels most like you?"

[WAIT]

User: "attack strong"

You: "Perfect. 'Attack strong' - that's your flip. Want me to build you a code to practice this?"

[WAIT]

User: "yeah"

You: "Alright, I made you a Rim Attack code. This helps you catch 'don't miss' outcome-anxiety and flip it to 'attack strong' when you're driving to the basket - shifts your focus from perfect results to aggressive execution. Check it out.

**🏀 Rim Attack**

**What**: Catches you when you're thinking "don't miss" at the rim and flips you to "attack strong" - shifts from outcome-anxiety to execution mode.

**When**: The moment you're driving to the basket and feel that outcome-pressure creeping in ("don't miss", "gotta make this").

**How**:
• Catch the "don't miss" thought the second it shows up
• Flip to "attack strong" - feel the difference (worry → aggression)
• Flash that wide open layup with your new mindset
• Attack the rim with confidence

**Why**: Your brain thinks missing = failure, but NBA players miss 30-40% at the rim. Your job isn't perfection - it's aggressive execution. This rewires you from "don't fail" mode to "attack" mode.

**Cheat Code Phrase**: "attack strong"

Flip through it and hit save if it feels right. Let me know how it works on the court."

---

EXAMPLE: User Is Vague

User: "I just get nervous when I play"

You: "Yeah, that nervousness can be frustrating. Help me understand it better - what's going through your head when you feel that nervousness? Like what's the actual thought?"

[WAIT - gather their specific negative thought, when it happens, outcome, then TEACH]

---

FINAL PRE-SEND CHECK:

Before sending ANY response:

1. ✅ Did I wait for their response if I asked a question?
2. ✅ Am I asking them to repeat information they already gave?
3. ✅ Am I looping on the same question in different words?
4. ✅ Do I have 3+ question marks?
5. ✅ Am I teaching when they gave me specifics, or still asking questions?
6. ✅ Am I using scripted language like "Oof, I get that"?
7. ✅ If creating code: Does it have their exact phrase and follow format?

If ANY check fails, rewrite your response.

---

Let's get to work.
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

    // Expect: { messages: [{role, content}...], meta?: { primaryIssue?: string, turns?: number, isFirstCode?: boolean }, userId?: string }
    const clientMessages = Array.isArray(body?.messages) ? (body.messages as ChatMsg[]) : [];
    const meta = body?.meta || {};
    const userId = body?.userId;
    const isFirstCode = meta?.isFirstCode || false;
    const lastUser = [...clientMessages].reverse().find(m => m.role === 'user')?.content ?? '';

    // Check if this is a code follow-up system message
    const isCodeFollowUp = lastUser.startsWith('[SYSTEM: User just viewed the');
    const codeFollowUpMatch = lastUser.match(/\[SYSTEM: User just viewed the "(.+?)" code for the first time\./);
    const codeNameViewed = codeFollowUpMatch ? codeFollowUpMatch[1] : null;

    const userExplicitlyAskedForCode = EXPLICIT_CODE_REGEX.test(lastUser);

    const turns = Number(meta?.turns ?? clientMessages.length);
    const hasEnoughDetail = hasSubstantialConversation(clientMessages);
    const shouldGateCode = !userExplicitlyAskedForCode && (turns < MIN_TURNS_FOR_CODE || !hasEnoughDetail);

    const messages: ChatMsg[] = [];

    // 1) Core identity
    console.log('🔍 SYSTEM PROMPT VERSION: v3.1 with PRE-FLIGHT CHECKS');
    console.log('🔍 System prompt starts with:', SYSTEM_PROMPT.substring(0, 100));
    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    // 2) User personalization context from onboarding (if userId provided)
    if (userId) {
      try {
        // Fetch user data from Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const userDataRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          });

          if (userDataRes.ok) {
            const userData = await userDataRes.json();
            if (userData && userData.length > 0) {
              const user = userData[0];

              // Build personalization context
              const personalContext = [];
              if (user.full_name) personalContext.push(`Player's name: ${user.full_name}`);
              if (user.age_bracket) personalContext.push(`Age: ${user.age_bracket}`);
              if (user.skill_level) personalContext.push(`Level: ${user.skill_level}`);
              if (user.confidence_level) personalContext.push(`Current confidence level: ${user.confidence_level}/5`);
              if (user.confidence_blockers && Array.isArray(user.confidence_blockers) && user.confidence_blockers.length > 0) {
                personalContext.push(`Main confidence blockers: ${user.confidence_blockers.join(', ')}`);
              }
              if (user.confidence_goal) personalContext.push(`Primary goal: ${user.confidence_goal}`);
              if (user.biggest_challenge) personalContext.push(`Why it matters to them: ${user.biggest_challenge}`);

              if (personalContext.length > 0) {
                messages.push({
                  role: 'system',
                  content: `Context about this player (from their onboarding):\n${personalContext.join('\n')}\n\nUse this to personalize your coaching, but don't explicitly reference "onboarding" or repeat this info verbatim. Naturally incorporate their challenges and goals into your conversation.`,
                });
              }
            }
          }
        }
      } catch (err) {
        // Silently fail - continue without personalization
        console.error('Failed to fetch user context:', err);
      }
    }

    // 3) Conversation memory - load past chats to spot patterns and build relationship
    if (userId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
          // Fetch past 5 completed chats (excluding current one)
          const chatsRes = await fetch(
            `${supabaseUrl}/rest/v1/chats?user_id=eq.${userId}&is_active=eq.false&order=updated_at.desc&limit=5`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );

          if (chatsRes.ok) {
            const pastChats = await chatsRes.json();
            if (pastChats && pastChats.length > 0) {
              // Build memory summary from past chats
              const memorySummary = pastChats.map((chat: any, index: number) => {
                const messages = Array.isArray(chat.messages) ? chat.messages : [];
                const userMessages = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content).join(' | ');
                const topic = chat.selected_topic?.title || 'General conversation';
                return `\nPast conversation ${index + 1} (${topic}):\nUser talked about: ${userMessages.slice(0, 500)}`;
              }).join('\n');

              messages.push({
                role: 'system',
                content: `================================================================================
CONVERSATION MEMORY (CRITICAL - READ EVERY TIME)
================================================================================

You've talked with this player before. Here's what they've shared in past conversations:
${memorySummary}

**MANDATORY PATTERN RECOGNITION:**

You MUST actively scan for:
1. **Repeated topics** - If they're bringing up something similar to a past conversation, SAY SO
2. **Recurring struggles** - If the same issue keeps coming up, call it out ("Yo, this is the third time we've talked about this...")
3. **Related themes** - Even if wording is different, recognize when topics connect
4. **Progress or lack thereof** - If they previously worked on something, check in on it

**HOW TO REFERENCE PAST CONVERSATIONS:**

✅ NATURAL WAYS TO SHOW YOU REMEMBER:
- "Wait, didn't we talk about this before? With the..."
- "This sounds familiar - we touched on this a few conversations back, right?"
- "Yo, I'm noticing a pattern here. Last time you mentioned..."
- "This is actually the second/third time this has come up..."
- "I remember you saying something similar about..."
- "We've worked on this before - what's different this time?"

❌ DON'T SAY:
- "According to my records..." (too robotic)
- "In conversation #3..." (too clinical)
- Long summaries of past talks (brief references only)

**THE RULE:**
If there's even a HINT of similarity to a past conversation, acknowledge it. Players need to feel like you KNOW them and remember their journey. Each conversation should feel like continuing a relationship, not starting fresh.

If you DON'T reference relevant past conversations when they exist, the player will feel like you don't remember them and lose trust.`,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversation memory:', err);
      }
    }

    // 4) Light memory/context
    if (meta?.primaryIssue) {
      messages.push({
        role: 'system',
        content: `Primary issue (persisted): ${String(meta.primaryIssue)}`,
      });
    }

    // 3) Phase gate
    if (shouldGateCode) {
      // If it's their first code, be more eager to create it
      if (isFirstCode && turns >= 2) {
        messages.push({
          role: 'system',
          content:
            'This is their FIRST cheat code. After 2-3 quality exchanges where you\'ve taught the reframe AND had them CO-CREATE their personal phrase and anchor it, generate the code using THEIR language. REMEMBER: Start with 1-2 sentences of intro text explaining what you made them, THEN the code in markdown format using THEIR phrase, THEN 1 sentence telling them to flip through and save it. Make it encouraging - this is their first personalized confidence tool that THEY co-created.',
        });
      } else {
        messages.push({
          role: 'system',
          content:
            'Not ready to generate code yet - BUT DON\'T INTERROGATE. If the user gave you specifics (their thought, when it happens, the outcome), TEACH THE REFRAME NOW in conversation, then offer them 2-3 phrase OPTIONS and let them pick. Explain what\'s happening, give them the reality/logic, show them the direction of the flip, then offer options: "The flip is: \'X\' or \'Y\' or \'Z\' - which feels most like you?" After they pick, anchor to their memory, frame as identity shift. If they were vague ("I just get nervous"), ask 1-2 clarifying questions to get their specific thought and situation. DO NOT ask them to repeat information they already gave you.',
        });
      }
    } else {
      messages.push({
        role: 'system',
        content:
          'Ready to generate code. Before creating, ensure you have: (1) specific confidence issue, (2) clear trigger/moment, (3) how it shows up in their play, (4) THEIR CO-CREATED PHRASE in their own words, (5) anchored to their specific memory or moment, (6) 🚨 VERIFICATION CHECK: Did you already ask them to explain the shift in your last message? If YES and they gave ANY response (even "it\'s hard to say" or a short answer), then they ANSWERED - move forward and offer/create the code. DON\'T ask them to explain again. If NO, you haven\'t verified yet - ask ONCE: "So when you catch yourself thinking [old way], what\'s the flip you\'re making?" But only ask this ONE TIME. When generating the code, FOLLOW THE EXACT FORMAT from the system prompt: Start with intro text that includes: (1) code name, (2) what it does, (3) how it addresses their issue, (4) invitation to view. THEN the markdown code starting with **🏀** using THEIR phrase, THEN 1 sentence outro text. NEVER say just "Here you go!" or "Awesome! Here\'s what I\'ve built for you:" - you MUST explain what the code does.',
      });
    }

    // 4) User + assistant history from client
    for (const m of clientMessages) {
      // Ensure roles are valid strings; coerce content to string
      if (m?.role && typeof m.content === 'string') {
        // Skip adding the [SYSTEM: ...] message to history - we'll handle it separately
        if (!m.content.startsWith('[SYSTEM: User just viewed the')) {
          messages.push({ role: m.role, content: m.content });
        }
      }
    }

    // 4.5) Special handling for code follow-up
    if (isCodeFollowUp && codeNameViewed) {
      messages.push({
        role: 'system',
        content: `The user just finished viewing the "${codeNameViewed}" code you created for them. This is the FIRST time they've seen it.

CRITICAL INSTRUCTIONS:
1. Ask them what they thought of it in a natural, conversational way
2. Make your follow-up feel like a continuation of your current conversation - NOT a scripted/robotic prompt
3. Keep it casual and brief - like you're checking in with a friend
4. Reference something specific about the code or their situation to keep it personal
5. DO NOT say things like "What did you think?" or "How does it look?" - be more specific and natural
6. ALWAYS remind them they can ask questions or request changes - make it clear you're open to adjusting anything that doesn't fit

GOOD EXAMPLES:
- "So what do you think - does that ${codeNameViewed} routine feel like something you could actually run through before games? If anything doesn't make sense or you want to change something, just let me know."
- "How's that ${codeNameViewed} code looking? Feel like it fits what you need, or should we adjust something?"
- "Does that ${codeNameViewed} approach make sense for your situation? If something feels off or you want me to tweak anything, just say the word."
- "That ${codeNameViewed} code gonna work for you? If you want to change any part of it or have questions, we can dial it in."

BAD EXAMPLES (too robotic or doesn't invite feedback):
❌ "What did you think of the code?"
❌ "How does it look?"
❌ "Did you like it?"
❌ "What are your thoughts?"
❌ "So, does that work for you?" (doesn't explicitly invite changes)

REQUIRED: Your follow-up MUST include both:
- A specific question about how the code fits their situation
- An explicit invitation to ask questions or request changes

Keep it natural, specific, and conversational while making them feel comfortable requesting adjustments.`
      });
    }

    // 5) CRITICAL: Add final reminder right before AI responds if they asked for a code
    if (userExplicitlyAskedForCode || !shouldGateCode) {
      // Fetch user's saved cheat codes from database to prevent duplicates
      const savedCodeTitles: string[] = [];
      if (userId) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseKey) {
            const savedCodesRes = await fetch(
              `${supabaseUrl}/rest/v1/cheat_codes?user_id=eq.${userId}&select=title&is_active=eq.true`,
              {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (savedCodesRes.ok) {
              const savedCodes = await savedCodesRes.json();
              savedCodeTitles.push(...savedCodes.map((c: { title: string }) => c.title));
              console.log('[DUPLICATE CHECK] Fetched saved code titles:', savedCodeTitles);
            } else {
              console.error('[DUPLICATE CHECK] Failed to fetch saved codes:', savedCodesRes.status, savedCodesRes.statusText);
            }
          }
        } catch (err) {
          console.error('Error fetching saved cheat codes:', err);
        }
      }

      // Extract all code names from conversation history
      const previousCodeNames: string[] = [];
      const previousTechniques: string[] = [];

      for (const msg of clientMessages) {
        if (msg.role === 'assistant' && msg.content.includes('**🏀')) {
          // Extract code name
          const titleMatch = msg.content.match(/\*\*🏀\s*([^*]+?)\*\*/);
          if (titleMatch) {
            previousCodeNames.push(titleMatch[1].trim());
          }

          // Detect techniques used
          if (msg.content.toLowerCase().includes('breath') || msg.content.toLowerCase().includes('inhale')) {
            previousTechniques.push('breathing');
          }
          if (msg.content.toLowerCase().includes('visualiz') || msg.content.toLowerCase().includes('picture yourself')) {
            previousTechniques.push('visualization');
          }
          if (msg.content.toLowerCase().includes('say to yourself') || msg.content.toLowerCase().includes('tell yourself')) {
            previousTechniques.push('mantra');
          }
        }
      }

      // Check if a code was JUST created in the last 1-2 exchanges
      let recentlyCreatedCode: string | null = null;
      const recentMessages = clientMessages.slice(-4); // Check last 4 messages (2 exchanges)

      for (const msg of recentMessages) {
        if (msg.role === 'assistant' && msg.content.includes('**🏀')) {
          const titleMatch = msg.content.match(/\*\*🏀\s*([^*]+?)\*\*/);
          if (titleMatch) {
            recentlyCreatedCode = titleMatch[1].trim();
            console.log('[RECENT CODE DETECTED]:', recentlyCreatedCode);
            break; // Get the most recent one
          }
        }
      }

      let criticalInstructions = '';

      // If a code was just created, prevent regeneration
      if (recentlyCreatedCode) {
        criticalInstructions += `🚨🚨🚨 CONVERSATION CONTINUITY - CODE ALREADY EXISTS 🚨🚨🚨\n\nYou JUST created a code called "${recentlyCreatedCode}" in the last 1-2 messages. The user is now asking a follow-up question or expressing a concern about THAT code.\n\n**DO NOT:**\n- Treat this as a NEW code creation request\n- Say "Want me to build you a code?" (it already exists!)\n- Say "Alright, I made you a code called '${recentlyCreatedCode}'" (you already did!)\n- Regenerate the code from scratch\n\n**DO:**\n- Recognize this is a FOLLOW-UP conversation about the existing "${recentlyCreatedCode}" code\n- Address their question/concern directly\n- If they want changes, offer to "update" or "adjust" the code, not "create" a new one\n- Continue the conversation naturally, building off what was just discussed\n\n**EXAMPLE:**\nUser: "I think it feels pretty good.. what if I don't really have any times in mind where I've attacked good?"\nYou: "That's actually perfect - you don't NEED a memory of attacking great. The anchor works because you're connecting the phrase to ANY moment where you felt that hesitation. Even if you've never attacked 'perfectly,' you've definitely felt the difference between hesitating vs going for it. That contrast is enough. The code will help you build NEW confident attack memories going forward."\n\nThis is conversation continuity. Keep the context and build on it.\n\n---\n\n`;
      }

      criticalInstructions += 'CRITICAL INSTRUCTION FOR THIS RESPONSE: If you are generating a cheat code, you MUST include intro text BEFORE the code and outro text AFTER the code. The intro text MUST include: (1) the code name, (2) what it does in 1-2 sentences, (3) how it addresses their specific issue, (4) invitation to view. DO NOT say "Awesome! Here\'s what I\'ve built for you:" or "Here you go!" or similar - you must explain WHAT you built and WHY. Structure: [Intro with code name + explanation + connection to their issue] + [blank line] + [code starting with **🏀**] + [blank line] + [1 sentence outro].';

      // Combine saved codes and conversation codes for duplicate checking
      const allExistingTitles = [...savedCodeTitles, ...previousCodeNames];

      // Add duplicate name warning
      if (allExistingTitles.length > 0) {
        criticalInstructions += `\n\n🚨 DUPLICATE NAME BLOCKER: The user has already saved codes with these EXACT names in their account: ${allExistingTitles.join(', ')}. You CANNOT use ANY of these names again OR similar variations (e.g., if they have "Attack Mode", you cannot use "Attack Instinct", "Attack Power", or ANY Attack-* variation). The database will REJECT duplicate titles and the user will get an error. PICK A COMPLETELY DIFFERENT NAME from a different category/theme. Examples of different themes: Reset/Refresh (Reset Switch), Focus (Lock In), Flow (Game Flow), Power (Inner Power), Anchor (Ground Control), Identity (I'm Built For This).`;

        console.log('[DUPLICATE CHECK] Warning AI about existing titles:', allExistingTitles);
      }

      // Add variety warning
      if (previousTechniques.length > 0) {
        const lastTechnique = previousTechniques[previousTechniques.length - 1];
        criticalInstructions += `\n\n🚨 VARIETY ENFORCEMENT: Your LAST code used ${lastTechnique} as the primary technique. This new code MUST use a DIFFERENT primary technique. Do NOT start with the same approach. Examples of different primary techniques: music/playlist, physical ritual (finger snap, etc), progress tracking, memory recall, identity statements, reframing, sensory grounding. ROTATE the primary approach to keep codes feeling fresh.`;
      }

      // Add realism enforcement
      criticalInstructions += `\n\n🚨 REALISM CHECK (CRITICAL): Before generating, verify the "When" and "How" match:
- If "When" says "during the game" or "on the court" → EVERY step in "How" must be INSTANTLY executable (1-5 seconds each, max 10 seconds total)
- BANNED for in-game: "Say out loud" (telegraphs strategy), "power pose for X seconds" (can't stand still), "close eyes", "listen to music"
- REQUIRED for in-game: "Say to yourself" (internal), "one breath" (quick), "touch your shoe" (instant), body language cues (instant)
- If any step would: (1) take >5 seconds during game, (2) telegraph strategy to opponents, (3) look awkward to teammates, (4) require stopping play → REDESIGN THE CODE
The user will IMMEDIATELY lose trust if steps are impossible to execute in the specified situation.`;

      messages.push({
        role: 'system',
        content: criticalInstructions
      });

      // Add SEPARATE duplicate blocker message as final instruction if there are existing titles
      if (allExistingTitles.length > 0) {
        messages.push({
          role: 'system',
          content: `🚨🚨🚨 STOP - DUPLICATE NAME CHECK REQUIRED 🚨🚨🚨\n\nBEFORE you write the code title, check this list of FORBIDDEN names:\n\n${allExistingTitles.map(t => `- "${t}"`).join('\n')}\n\nYou CANNOT use:\n1. Any of these EXACT names\n2. ANY variation with the same first word (e.g., if "Attack Mode" exists, you can't use "Attack Instinct", "Attack Power", "Attack Focus", etc.)\n3. ANY similar phrasing\n\nThe database will REJECT duplicate titles and show an error to the user.\n\nPICK A COMPLETELY DIFFERENT NAME using a different theme/category. Safe examples: "Reset Switch", "Lock In", "Game Flow", "Inner Power", "Ground Control", "I'm Built For This", "Claim Your Space", "Trust The Work".`
        });
      }
    }

    // CRITICAL: Add final pre-response checks (last message before OpenAI call)
    messages.push({
      content: `🚨 QUICK CHECK BEFORE YOU RESPOND 🚨

1. **Did I wait for their response if I asked a question?**
   - If I asked something, did I STOP? Or did I keep talking?

2. **Am I asking them to repeat info they already gave?**
   - Did they already tell me their thought/when/outcome?

3. **Am I asking too many questions?**
   - Do I have 3+ question marks? Cut it down or teach instead.

4. **Am I teaching when they gave me specifics?**
   - If they shared their struggle with details, did I TEACH the reframe?
   - Or am I still asking questions?

5. **Did I let them co-create the phrase?**
   - Did I offer 2-3 options for them to pick?
   - Or did I just tell them what to say?

6. **Am I following the SIMPLIFIED FLOW?**
   - Understand → Teach → Co-create phrase → Offer to build code
   - NOT: Understand → Teach → Co-create → Anchor → Verify → Offer
   - Skip the anchoring and verification unless it feels natural

7. **If creating a code: Does it follow the EXACT format?**
   - Intro text before the code (explain what it does)
   - **🏀 Title** format
   - All sections: What, When, How (with • bullets), Why, Cheat Code Phrase
   - Outro text after the code

If ANY check fails, rewrite your response.

Remember: SIMPLE FLOW. Don't overthink it. If they picked a phrase that resonates, just build the code.`

    });

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
    const reply = sanitizeReply(String(raw || "Let's keep going. What part of that moment feels hardest?"));

    // Debug logging to see what AI actually returned
    if (raw.includes('**🏀')) {
      console.log('🔍 CODE DETECTED IN RESPONSE');
      console.log('📝 First 200 chars:', raw.substring(0, 200));
      console.log('📝 Last 200 chars:', raw.substring(raw.length - 200));
      console.log('✅ Has intro before code?', !raw.trim().startsWith('**🏀'));
      console.log('✅ Has outro after phrase?', !raw.trim().endsWith('"'));
    }

    return new Response(JSON.stringify({
      reply,
      _debug_prompt_version: 'v6.4-dont-ask-anchoring-twice',
      _debug_prompt_start: SYSTEM_PROMPT.substring(0, 150)
    }), {
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