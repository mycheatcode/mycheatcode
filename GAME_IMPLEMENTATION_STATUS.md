# Cheat Code Game Implementation Status

## ✅ COMPLETED: Backend Infrastructure

### 1. Database Schema (`/database-migrations/add-game-tables.sql`)
Created two new tables:
- **`game_scenarios`**: Stores 9-12 AI-generated scenarios per cheat code
  - Fields: id, cheat_code_id, user_id, situation, current_thought, options (JSONB)
  - Indexes on cheat_code_id and user_id
  - RLS policies for security

- **`game_sessions`**: Tracks each game play session
  - Fields: id, cheat_code_id, user_id, score, scenario_ids, user_answers, momentum_awarded, is_first_play
  - Tracks performance and momentum gains

- **Updated `cheat_codes` table**:
  - Added `has_game_scenarios` boolean flag
  - Added `game_scenarios_generated_at` timestamp

**ACTION REQUIRED**: Run this SQL migration in your Supabase dashboard.

---

### 2. TypeScript Types (`/lib/types/game.ts`)
Defined all data structures:
- `GameOption`, `GameScenario`, `GameSession`
- `GameSessionResult`
- Request/Response types for all API endpoints

---

### 3. Game Logic Library (`/lib/game.ts`)
Core database operations:
- `saveGameScenarios()` - Save AI-generated scenarios
- `getGameScenarios()` - Fetch all scenarios for a code
- `getRandomScenarios()` - Get 3 random scenarios for a game session
- `hasGameScenarios()` - Check if scenarios exist
- `calculateScore()` - Determine how many questions user got right
- `saveGameSession()` - Record completed game session
- `canEarnMomentum()` - Check if user can still earn momentum (max 2 times)
- `getGameSessionCount()` - Get play count for analytics

---

### 4. Momentum System (`/lib/progress.ts`)
Updated momentum calculation:
- Added `awardGameCompletionMomentum()` function
- Score-based rewards:
  - **3/3 correct** = +5% momentum
  - **2/3 correct** = +3% momentum
  - **1/3 correct** = +1% momentum
  - **0/3 correct** = 0% momentum
- **First play bonus**: +5% additional if played immediately after code creation
- Respects daily cap system
- Can earn momentum for first 2 plays only

---

### 5. API Endpoints

#### `/api/game/generate-scenarios` (POST)
Generates 10 scenarios using Claude AI based on cheat code data.
- Input: `{ cheat_code_id, cheat_code_data }`
- Uses Claude 3.5 Sonnet to generate contextual scenarios
- Saves to database
- Returns: `{ success, scenarios_count }`

#### `/api/game/get-scenarios` (POST)
Fetches 3 random scenarios for gameplay.
- Input: `{ cheat_code_id }`
- Returns: `{ success, has_scenarios, scenarios }`

#### `/api/game/submit-session` (POST)
Submits completed game, awards momentum, saves session.
- Input: `{ cheat_code_id, scenario_ids, user_answers, is_first_play }`
- Calculates score
- Awards appropriate momentum
- Returns: `{ success, result }` with momentum gains

---

## 🚧 TODO: Integration & UI

### 6. Chat Route Integration
**File to modify**: `/app/api/chat/route.ts`

After a cheat code is created in chat, need to:
1. Call `/api/game/generate-scenarios` to create scenarios
2. Prompt user: "Want to get your first reps in with [Code Name]?"
3. If user accepts, display game component inline in chat

### 7. My Codes Page Integration
**Files to modify**:
- My Codes page component
- Individual cheat code cards

Changes needed:
1. Replace "Log Code" button with "Get Reps" button
2. On click, check if scenarios exist:
   - If yes: Load game modal/component
   - If no: Generate scenarios first, then load game
3. Show game completion history/stats per code

### 8. Reusable Game Component
**File to create**: `/components/CheatCodeGame.tsx`

Should accept props:
- `cheatCodeId: string`
- `isFirstPlay: boolean`
- `onComplete?: (result: GameSessionResult) => void`
- `mode?: 'inline' | 'modal'` (for chat vs My Codes page)

Use the existing game UI from `/app/test/reframe-game/page.tsx` as the foundation.

---

## 📋 Implementation Checklist

- [x] Database schema
- [x] TypeScript types
- [x] Game logic library
- [x] Momentum system update
- [x] API endpoints (generate, fetch, submit)
- [ ] Run SQL migration in Supabase
- [ ] Integrate with chat route (trigger after code creation)
- [ ] Create reusable game component
- [ ] Update My Codes page UI
- [ ] Test end-to-end flow
- [ ] Handle edge cases (no scenarios, API failures, etc.)

---

## 🔧 Next Steps

1. **Run the SQL migration** in Supabase dashboard
2. **Test API endpoints** manually with Postman/curl
3. **Create the reusable game component** using the test page as reference
4. **Integrate into chat flow** to trigger after code creation
5. **Update My Codes page** to add "Get Reps" functionality

---

## 💡 Key Design Decisions

1. **10 scenarios generated** per code (randomly pick 3 each game)
2. **Momentum only for first 2 plays** to prevent grinding
3. **First play bonus (+5%)** to incentivize immediate practice
4. **Score-based rewards** to encourage improvement
5. **Scenarios tied to specific code** for deep personalization
6. **AI generates all scenarios** for contextual relevance
