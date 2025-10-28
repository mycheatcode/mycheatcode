# Cheat Code Format Rules - Quick Summary

## ⚠️ CRITICAL: When updating the AI system prompt, preserve these EXACT format requirements

### Required Output Structure
```
[1-2 sentences intro text]

**🏀 [Title]**
*"[Phrase]"*
**What:** [text]
**When:** [text]
**How:**
• [step 1]
• [step 2]
**Why:** [text]
**Cheat Code Phrase:** "[phrase]"

[1 sentence outro text]
```

### Non-Negotiable Elements

1. **Intro text** - MUST come before `**🏀`
2. **`**🏀`** - Frontend splits at this exact marker
3. **Markdown sections** - `**What:**`, `**When:**`, `**How:**`, `**Why:**`, `**Cheat Code Phrase:**`
4. **Bullet character** - Use `•` (not `-` or `*`)
5. **Outro text** - MUST come after `**Cheat Code Phrase:**`

### What Breaks the UI

❌ No intro text → User sees button with no context
❌ Wrong emoji or no `**` → Frontend can't split intro from code
❌ Missing sections → Code not detected, shows as plain text
❌ No outro text → Incomplete conversation

### System Prompt Key Lines to Preserve

```
DO NOT skip the intro or outro text.
DO NOT start directly with **🏀**.
Structure: [1-2 sentences intro] + [code starting with **🏀**] + [1 sentence outro]
```

### Testing

Ask: "Quick! Make me a code for post-game relaxation"

Expected result:
- Intro text above button ✓
- "View Cheat Code" button ✓
- No raw code in chat ✓
- Outro text below button ✓
