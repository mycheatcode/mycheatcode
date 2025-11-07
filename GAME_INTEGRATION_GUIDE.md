# Game Integration Guide

## ✅ What's Already Built

All backend infrastructure is complete:
- ✅ Database tables created in Supabase
- ✅ API endpoints for scenarios and sessions
- ✅ Momentum system integrated
- ✅ Reusable `CheatCodeGame` component

## 🎯 What's Left: Chat Page Integration

You need to add the game modal to `/app/chat/page.tsx`. Here's exactly what to do:

---

## Step 1: Import the Game Component

At the top of `/app/chat/page.tsx`, add:

```typescript
import CheatCodeGame from '@/components/CheatCodeGame';
import type { GameSessionResult } from '@/lib/types/game';
```

---

## Step 2: Add Game Modal State

Around line 58 (after `const [selectedCheatCode, setSelectedCheatCode] = useState<any>(null);`), add:

```typescript
const [showGameModal, setShowGameModal] = useState(false);
const [gameCheatCodeId, setGameCheatCodeId] = useState<string | null>(null);
const [gameCheatCodeTitle, setGameCheatCodeTitle] = useState<string>('');
const [isFirstGamePlay, setIsFirstGamePlay] = useState(false);
```

---

## Step 3: Add Game Modal Handlers

Add these functions somewhere with your other handlers (around line 200-300):

```typescript
const handleStartGame = (cheatCodeId: string, title: string, isFirstPlay: boolean = false) => {
  setGameCheatCodeId(cheatCodeId);
  setGameCheatCodeTitle(title);
  setIsFirstGamePlay(isFirstPlay);
  setShowGameModal(true);
};

const handleGameComplete = async (result: GameSessionResult) => {
  console.log('Game completed:', result);

  // Show momentum gain if any
  if (result.momentum_awarded > 0) {
    const momentumGain = result.new_momentum - result.previous_momentum;
    showMomentumBanner({
      previousMomentum: result.previous_momentum,
      newMomentum: result.new_momentum,
    });
  }

  // Close modal after a brief delay
  setTimeout(() => {
    setShowGameModal(false);
    setGameCheatCodeId(null);
  }, 2000);
};

const handleCloseGameModal = () => {
  setShowGameModal(false);
  setGameCheatCodeId(null);
};
```

---

## Step 4: Add "Start Practice Game" Button

Find where the "View Cheat Code" button is rendered (around line 1374 and 1614).

**Right after the "View Cheat Code" button**, add this:

```tsx
{/* Start Practice Game Button */}
{cheatCodeIds.has(message.id) && (
  <div className="flex justify-center w-full px-2 mt-3">
    <button
      onClick={() => {
        const codeId = cheatCodeIds.get(message.id);
        if (codeId) {
          handleStartGame(codeId, cheatCode.title, !viewedCodes.has(message.id));
        }
      }}
      className="w-full max-w-md rounded-xl px-6 py-2.5 transition-all active:scale-[0.98] font-semibold text-sm"
      style={{
        backgroundColor: '#00ff41',
        color: '#000000',
        boxShadow: '0 0 15px rgba(0, 255, 65, 0.3)'
      }}
    >
      🏀 Start Practice Game
    </button>
  </div>
)}
```

**Note**: You'll need to add this in TWO places (mobile and desktop versions). Look for the two instances of "View Cheat Code" button.

---

## Step 5: Add Game Modal Render

At the very end of the return statement, right before the closing tags (after the Cheat Code Modal, around line 2000), add:

```tsx
{/* Game Modal */}
{showGameModal && gameCheatCodeId && (
  <div className="fixed inset-0 bg-black z-[120]">
    <CheatCodeGame
      cheatCodeId={gameCheatCodeId}
      cheatCodeTitle={gameCheatCodeTitle}
      isFirstPlay={isFirstGamePlay}
      onComplete={handleGameComplete}
      onClose={handleCloseGameModal}
    />
  </div>
)}
```

---

## Step 6: Update Chat API to Generate Scenarios

In `/app/api/chat/route.ts`, find where cheat codes are saved (search for `saveCheatCode`).

**Right after successfully saving a cheat code**, add:

```typescript
// Generate game scenarios in background (don't await - let it run async)
if (cheatCodeId) {
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/game/generate-scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cheat_code_id: cheatCodeId,
      cheat_code_data: {
        title: cheatCodeData.title,
        category: cheatCodeData.category,
        what: cheatCodeData.what,
        when: cheatCodeData.when,
        how: cheatCodeData.how,
        why: cheatCodeData.why,
        phrase: cheatCodeData.phrase,
        // Try to extract from conversation context if available
        original_situation: '', // You can extract from chat context if needed
        original_thought: '',
      },
    }),
  }).catch(err => console.error('Failed to generate scenarios:', err));
}
```

---

## 🎉 That's It!

After these changes:

1. When a code is created, scenarios will generate in the background
2. A green "🏀 Start Practice Game" button appears below "View Cheat Code"
3. Clicking it opens the full-screen game modal
4. On completion, momentum is awarded and shown to the user
5. Modal closes automatically

---

## 🔍 Testing Checklist

- [ ] Create a cheat code in chat
- [ ] "Start Practice Game" button appears
- [ ] Click button - game modal opens
- [ ] Complete the game
- [ ] Momentum gain shows
- [ ] Modal closes
- [ ] Can replay the game (momentum only awarded first 2 times)

---

## 📝 Optional: Add to My Codes Page

For the My Codes page, you'll want to add a similar "Get Reps" button to each cheat code card. The pattern is the same - use the `CheatCodeGame` component in a modal.

Let me know when you're ready to integrate that part!
