# Cheat Code Format Requirements for Chat UX

## CRITICAL: DO NOT CHANGE THESE FORMATTING RULES

This document defines the **mandatory** cheat code output format that the AI coach MUST follow. Changing this format will break the chat UI and user experience.

---

## Why This Format Matters

The frontend chat component (`/app/chat/page.tsx`) parses the AI's response to:
1. Detect when a cheat code is present
2. Extract intro text to display above the button
3. Extract the code content to display in the modal
4. Show a clean "View Cheat Code" button

**If the AI doesn't follow this format exactly, the UI will break.**

---

## Required Output Structure

When the AI generates a cheat code, it MUST follow this 3-part structure:

```
[INTRO TEXT - 1-2 sentences of context]

**🏀 [Code Title]**

*"[Mantra phrase]"*

**What:** [Description]

**When:** [Timing]

**How:**
• [Step 1]
• [Step 2]
• [Step 3]

**Why:** [Explanation]

**Cheat Code Phrase:** "[Mantra]"

[OUTRO TEXT - 1 sentence instruction to view/save]
```

---

## Critical Elements (DO NOT REMOVE OR CHANGE)

### 1. INTRO TEXT (Required)
- **Purpose:** Provides context about what code was made and why it helps
- **Format:** 1-2 sentences BEFORE the `**🏀` marker
- **Example:** "I got you! I made you a Post-Game Relaxation Code to help you unwind and reset after the game. This will help clear your mind and recover from any stress or pressure."
- **Why it matters:** Without intro text, users just see a button with no context

### 2. BASKETBALL EMOJI MARKER (Required)
- **Format:** `**🏀 [Title]**`
- **Critical:** Must start with `**🏀` (two asterisks + basketball emoji)
- **Why it matters:** The frontend uses `text.indexOf('**🏀')` to split intro text from code content
- **DO NOT:**
  - Remove the emoji
  - Change the emoji to something else
  - Remove the `**` markdown
  - Put the emoji without asterisks

### 3. MARKDOWN FORMAT (Required)
All section headers MUST use this exact format:
- `**What:**` - What this code helps with
- `**When:**` - When to use it
- `**How:**` - Action steps (use `•` bullet points)
- `**Why:**` - Why this works
- `**Cheat Code Phrase:**` - The mantra (in quotes)

**Why it matters:** The frontend's `isCheatCode()` function detects codes by checking for `**What:**`. The `parseCheatCode()` function extracts content using these exact markers.

### 4. BULLET POINTS (Required)
- **Format:** Use `•` (bullet character) NOT `-` or `*`
- **Example:**
  ```
  **How:**
  • Take three deep breaths
  • Say your phrase
  • Visualize success
  ```
- **Why it matters:** The parser expects `•` bullets to split how steps

### 5. OUTRO TEXT (Required)
- **Purpose:** Tells user to view/save the code
- **Format:** 1 sentence AFTER the `**Cheat Code Phrase:**` line
- **Example:** "Flip through the cards and save it to your collection if you're gonna use it."
- **Why it matters:** Completes the conversational flow

---

## Frontend Detection Logic (Reference Only)

### How the frontend detects cheat codes:

```typescript
// Detection function
const isCheatCode = (text: string): boolean => {
  return text.includes('**What:**') && text.includes('**When:**') &&
         text.includes('**How:**') && text.includes('**Why:**');
};

// Splitting function
const splitCheatCodeMessage = (text: string) => {
  const basketballEmojiIndex = text.indexOf('**🏀');
  if (basketballEmojiIndex !== -1) {
    const intro = text.substring(0, basketballEmojiIndex).trim();
    const cheatCodeText = text.substring(basketballEmojiIndex).trim();
    return { intro, cheatCodeText };
  }
  // ... fallback logic
};
```

**Key takeaway:** The frontend looks for:
1. `**🏀` to split intro from code
2. `**What:**`, `**When:**`, `**How:**`, `**Why:**` to detect and parse code

---

## System Prompt Instructions (Current Working Version)

These instructions are currently in `/app/api/chat/route.ts` and MUST be preserved:

```
CRITICAL OUTPUT REQUIREMENTS:
1. ALWAYS use the exact markdown format shown above (with 🏀, **, *, and • bullets)
2. NEVER add extra markers or wrappers around the code
3. The code will be automatically detected and rendered as swipeable flashcards

PRESENTING THE CODE TO THE USER - CRITICAL REQUIREMENTS:
!!!! EXTREMELY IMPORTANT - READ THIS CAREFULLY !!!!

When presenting a cheat code, you MUST ALWAYS follow this EXACT structure.
DO NOT skip the intro or outro text. DO NOT start directly with **🏀**.

REQUIRED STRUCTURE (DO NOT DEVIATE):

[INTRO TEXT - 1-2 sentences explaining what you made them]

**🏀 [Code Title]**

*"[Phrase]"*

**What:** [Description]

**When:** [Timing]

**How:**
• [Step]

**Why:** [Explanation]

**Cheat Code Phrase:** "[Phrase]"

[OUTRO TEXT - 1 sentence telling them to view/save it]
```

Additionally, there's a runtime system message that reinforces this:

```typescript
// Injected right before AI responds
messages.push({
  role: 'system',
  content: 'CRITICAL INSTRUCTION FOR THIS RESPONSE: If you are generating a cheat code, you MUST include intro text BEFORE the code and outro text AFTER the code. Structure: [1-2 sentences of intro] + [blank line] + [code starting with **🏀**] + [blank line] + [1 sentence outro]. DO NOT output just the code by itself. This is MANDATORY.',
});
```

---

## What Happens If Format Changes

### If you remove `**🏀`:
- Frontend won't be able to split intro text from code
- User sees ALL text in chat bubble (intro + code content)
- "View Cheat Code" button won't appear

### If you remove intro text:
- User just sees a button with no context
- Poor UX - they don't know what the code is for

### If you remove `**What:**`, `**When:**`, etc:
- Frontend won't detect it as a cheat code
- Everything displays as plain text
- No button, no modal, no cards

### If you remove outro text:
- Conversation feels incomplete
- User doesn't know they should view/save it

---

## Testing Checklist

When updating the system prompt, TEST by:

1. Start a fresh chat
2. Ask: "Quick! Please make me a code right away for relaxing post game"
3. Check the response:
   - [ ] Intro text appears ABOVE the button
   - [ ] "View Cheat Code" button appears
   - [ ] NO raw code content shows in chat
   - [ ] Outro text appears BELOW the button
   - [ ] Clicking button opens swipeable cards modal

---

## Quick Reference: DON'T DO THIS

❌ Starting response with `**🏀` (missing intro)
❌ Using `-` or `*` for bullets (must use `•`)
❌ Removing the basketball emoji
❌ Changing markdown format (`**What:**` → `What:`)
❌ Ending response with `**Cheat Code Phrase:**` (missing outro)
❌ Adding wrapper markers like `===CHEATCODE START===`
❌ Putting everything on one line without breaks

---

## Quick Reference: DO THIS

✅ Start with 1-2 sentences of intro text
✅ Use `**🏀 [Title]**` format
✅ Use exact markdown: `**What:**`, `**When:**`, `**How:**`, `**Why:**`, `**Cheat Code Phrase:**`
✅ Use `•` bullets for How steps
✅ End with 1 sentence outro text
✅ Include blank lines between sections for readability

---

## Contact

If you need to modify the cheat code format for any reason:
1. **FIRST** update the frontend detection logic in `/app/chat/page.tsx`
2. **THEN** update the system prompt format requirements
3. **THEN** test thoroughly with multiple code generations
4. **DOCUMENT** the changes in this file

**DO NOT** change the system prompt format without updating the frontend first, or the UI will break.
