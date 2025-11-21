# Critical Path Testing Checklist

> **IMPORTANT**: Run this checklist before EVERY deploy to production. Each ✅ must pass before shipping.

## 🔴 Critical Flows (Must Never Break)

### 1. Chat & Code Creation Flow
- [ ] **Start new chat from relatable topic**
  - Select a topic from /relatable-topics
  - Topic displays in "Session Focus" banner
  - Coach responds appropriately to topic

- [ ] **Create a new cheat code**
  - Have conversation that leads to code creation
  - Code displays as "View Cheat Code" button (NOT inline text)
  - Click button opens swipeable card modal
  - **PHRASE CARD shows "Save to My Codes" button** (NOT "Get Reps In")
  - Can swipe through all cards
  - Save button works and shows success animation with momentum gain

- [ ] **Coach follow-up after save**
  - After saving code, modal closes automatically
  - Coach sends follow-up message with "Get Reps In" button
  - Button appears AFTER typing animation completes

### 2. Practice Game Flow
- [ ] **Start practice game**
  - Click "Get Reps In" button on saved code
  - Game modal opens in fullscreen
  - Scenarios are relevant to the code's topic
  - All 3 answer options are age-appropriate (no "I'm learning" for adults)

- [ ] **Complete game normally**
  - Answer all questions
  - See results screen with score
  - Click "Done" to close
  - Coach sends follow-up with correct score (e.g., "2/3")
  - Momentum percentage increases and animates in green

- [ ] **Quit game immediately**
  - Click "Get Reps In" to start game
  - Click back/close button before answering ANY questions
  - Coach should NOT send a follow-up message
  - No "3/0" or confusing score message

### 3. My Codes Page
- [ ] **View saved codes**
  - Navigate to /my-codes
  - All saved codes display correctly
  - Each code has title, category, and actions

- [ ] **Mobile code viewer**
  - Click code on mobile
  - Modal opens with swipeable cards
  - Title card has NO category subheading
  - Phrase card shows correct phrase text
  - Phrase card has "Practice", "Open Chat", and "Archive" buttons

- [ ] **Desktop code viewer**
  - Click code on desktop
  - Modal opens with all code details
  - All sections display correctly

### 4. Relatable Topics
- [ ] **Topic selection**
  - Navigate to /relatable-topics
  - Select a topic that you've used before
  - Topic card should have green overlay and checkmark
  - Clicking it starts a new chat with that topic

### 5. Progress & Momentum
- [ ] **Momentum gain after code save**
  - Save a new code
  - Momentum percentage increases
  - Number animates in GREEN during gain
  - Green glow effect appears

- [ ] **Momentum gain after practice**
  - Complete a practice game
  - Momentum increases based on score
  - Percentage animates in green
  - Dashboard reflects new progress

## 🟡 Important Features (Should Work)

### Chat Features
- [ ] Chat history persists on refresh
- [ ] Can start blank chat (not from topic)
- [ ] Can end current chat and start new one
- [ ] Messages show correct timestamps
- [ ] Typing animation works for coach messages

### Code Management
- [ ] Can favorite/unfavorite codes
- [ ] Can archive/reactivate codes
- [ ] Can open chat from code (loads correct context)
- [ ] Can view code from chat history

### Navigation
- [ ] All sidebar links work
- [ ] Back button behavior is correct
- [ ] Mobile menu opens/closes properly

## 🟢 Polish (Nice to Have)

- [ ] Animations are smooth
- [ ] No console errors
- [ ] Mobile responsive on all screen sizes
- [ ] Dark mode displays correctly

## 🚨 Known Issues to Watch For

### High Priority Bugs to Verify Are Fixed:
1. ✅ **NEW codes showing "Get Reps In" instead of "Save to My Codes"**
   - Check: Create new code → phrase card → must show "Save to My Codes"

2. ✅ **"3/0" score when quitting game immediately**
   - Check: Start game → quit immediately → no coach follow-up

3. ✅ **Practice scenarios unrelated to code**
   - Check: "Trust My Shot" code → scenarios must ALL be about shooting situations

4. ✅ **"I'm learning" answers for adult players**
   - Check: Adult/men's league profile → game answers → no "I'm learning" language

5. ✅ **Relatable topic cards not showing as completed**
   - Check: Use a topic → return to topics page → should have green overlay

### Red Flags (Stop Deploy If You See These):
- ❌ Code displays as plain text instead of button
- ❌ Modal doesn't open or is blank
- ❌ Save button doesn't work
- ❌ Game doesn't load or crashes
- ❌ Console shows errors about undefined properties
- ❌ White screen / app won't load

## Testing Instructions

### How to Test Locally:
1. Run `npm run dev`
2. Open http://localhost:3000 in browser (desktop + mobile view)
3. Open DevTools Console (check for errors)
4. Go through each checklist item
5. Mark ✅ only if it works perfectly

### How to Test Staging:
1. Deploy to Vercel preview branch
2. Get preview URL from Vercel
3. Test on real mobile device + desktop
4. Go through checklist again

### Before Production Deploy:
1. ✅ All "Critical Flows" must pass
2. ✅ All "Known Issues" must be verified fixed
3. ✅ No red flag errors
4. ✅ Test on both mobile and desktop
5. ✅ Someone else should review the changes

## Quick Test Script

```bash
# Run this before every deploy
npm run build        # Verify no build errors
npm run test        # Run automated tests (when available)
npm run lint        # Check code quality
```

## Emergency Rollback

If something breaks in production:
```bash
# Revert to previous deploy on Vercel dashboard
# OR
git revert HEAD
git push
```

---

**Last Updated**: [Date]
**Last Tested By**: [Your Name]
**Version**: 1.0.0
