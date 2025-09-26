# Casual Conversation Mode V1 Implementation

## Overview

This implementation adds sophisticated conversation management to the basketball mental performance coaching app. The system ensures natural, flowing conversations while intelligently determining when to offer Cheat Code creation based on readiness signals.

## Key Features

### 🎯 Readiness Gates System
- **Minimum 3 questions** asked by coach before any code offer
- **4 readiness signals** must be present:
  1. **Trigger identified** - What sets the situation off
  2. **Goal clarified** - What they want to change
  3. **Context scoped** - When/where it happens
  4. **User buy-in** - Confirmation they want help

### 🚫 Hard Rules Enforcement
- **No em dash "—"** characters (auto-replaced with "-")
- **No "meditation"** word (replaced with alternatives like "focus reset", "breath reset")
- **Maximum 1 code offer** per session
- **5+ message cooldown** after declined offers

### 💬 Natural Conversation Flow
- Default behavior: stay conversational, listen, reflect
- Ask short clarifying questions
- Offer practical tips without pushing solutions
- Only suggest Cheat Codes when criteria are fully met

## File Structure

```
/lib/
  coaching-system.ts        # Core conversation logic and system prompts

/app/api/
  chat/route.ts            # Updated API with OpenAI integration

/app/chat/
  ChatInterface.tsx        # New chat UI component
  NewChatPage.tsx         # Section selection and main chat flow

/app/utils/
  chatService.ts          # Frontend chat utilities and message handling
```

## Implementation Details

### System Prompt Design

The coaching AI receives a comprehensive system prompt that includes:

- **Section context** (Pre-Game, In-Game, Post-Game, Locker Room, Off Court)
- **Active codes** in the current section
- **Hard rules** enforcement instructions
- **Conversation guidelines** and when NOT to offer codes
- **Code proposal format** requirements

### Conversation State Tracking

Each conversation maintains state including:
- Question count from coach
- Readiness signals detected
- Code offers made in session
- Messages since last decline
- Section and active codes context

### Message Analysis

Every message is analyzed for:
- **Questions from coach** (increments question counter)
- **Readiness signals from user**:
  - Trigger words: "when", "happens when", "triggers", "sets me off"
  - Goal words: "want to", "need to", "trying to", "goal is"
  - Context words: "during", "before", "after", "at the", "free throw"
  - Buy-in words: "yes", "exactly", "that's it", "right", "perfect"
- **Decline signals**: "not now", "no thanks", "maybe later"

### Post-Processing Pipeline

All AI responses go through post-processing to:
1. Replace any "—" characters with "-"
2. Replace "meditation" variants with approved alternatives
3. Ensure proper formatting and safety

## API Integration

### Environment Variables

Add to your `.env.local`:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Existing Supabase vars...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Request/Response Flow

1. **User sends message** → API saves to database
2. **Load conversation history** (last 20 messages)
3. **Get active codes** for current section
4. **Analyze conversation state** and readiness signals
5. **Call OpenAI** with system prompt and history
6. **Post-process response** to enforce hard rules
7. **Save coach response** and return with conversation state

## Frontend Components

### ChatInterface Component

- Real-time conversation UI
- Message bubbles with proper styling
- Code offer buttons (Save/Not Now) when valid offers detected
- Typing indicators and loading states
- Auto-scroll and keyboard shortcuts

### Section Selection

- Visual section picker with icons and descriptions
- Context-aware coaching based on selected section
- Clean navigation between selection and chat

### ChatService Utility

- API communication layer
- Message formatting and conversion
- Readiness signal analysis
- Code offer extraction from coach responses

## Usage Examples

### Casual Conversation (No Code Offer)
```
User: "Rough day at practice, coach was on me."
Coach: "Tough. Want to unpack what stung most - effort callouts or missed plays?"
```

### Building Toward Readiness
```
User: "I get nervous before free throws"  [trigger]
Coach: "What happens in your body when you step to the line?"
User: "Heart races, I think about missing"  [goal starting]
Coach: "When specifically - is it right when you get the ball or earlier?"
User: "Right when I get the ball"  [context]
Coach: "Got it. What would you want to happen instead?"
User: "I want to feel calm and focused"  [goal + buy-in]
Coach: "So when you get the ball at the line, instead of heart racing, you want that calm focus. That it?"
User: "Exactly!"  [buy-in confirmed]
Coach: "Here's what we'll do: 'Reset Rhythm' - Take one deep breath, feel your feet, then shoot. Save this as a Cheat Code?"
```

### Post-Decline Behavior
```
User: "Not right now"
Coach: "No worries. What else is on your mind?"
[Waits 5+ messages before offering again]
```

## Testing Scenarios

### Happy Path Testing
1. **Casual chat** - Verify no premature code offers
2. **Readiness building** - Test question counting and signal detection
3. **Valid code offer** - Confirm all criteria met before offering
4. **Code acceptance** - Test navigation to code creation
5. **Code decline** - Test cooldown behavior

### Edge Case Testing
1. **Hard rules** - Verify em dash and meditation replacements
2. **Rate limiting** - Test max 1 offer per session
3. **Signal false positives** - Ensure robust signal detection
4. **Long conversations** - Test with 20+ message histories
5. **Error handling** - API failures and network issues

### Content Quality Testing
1. **Athletic language** - Verify coaching tone
2. **Section context** - Confirm section-appropriate responses
3. **Question quality** - Evaluate clarifying questions
4. **Code proposals** - Check name/description quality

## Configuration

### Coaching Constants
```typescript
COACH_MIN_QUESTIONS = 3           # Minimum questions before code offer
MAX_CODE_OFFERS_PER_SESSION = 1  # Maximum offers per session
```

### OpenAI Parameters
```typescript
max_tokens: 500         # Keep responses concise
temperature: 0.7        # Balanced creativity
presence_penalty: 0.1   # Slight penalty for repetition
frequency_penalty: 0.1  # Slight penalty for overused words
```

## Monitoring & Analytics

### Conversation Quality Metrics
- Average questions asked before code offers
- Readiness signal detection accuracy
- Code offer acceptance rate
- Conversation length and engagement

### Technical Metrics
- API response times
- OpenAI API usage and costs
- Hard rule enforcement success rate
- Error rates and failure modes

## Next Steps (V2)

1. **Conversation Memory** - Persist conversation state across sessions
2. **Personalization** - Learn user preferences and communication style
3. **Advanced Analysis** - Sentiment analysis and emotional state detection
4. **Multi-turn Code Creation** - Iterative code refinement through conversation
5. **Performance Tracking** - Link conversations to actual code usage and effectiveness

## Troubleshooting

### Common Issues

1. **Premature Code Offers**
   - Check question count is >= 3
   - Verify all 4 readiness signals detected
   - Review signal detection logic

2. **Hard Rule Violations**
   - Confirm post-processing is applied
   - Check OpenAI response before processing
   - Update replacement patterns if needed

3. **Poor Conversation Quality**
   - Review system prompt for clarity
   - Adjust OpenAI parameters
   - Analyze conversation context and history

4. **API Errors**
   - Verify OpenAI API key and model
   - Check rate limiting and quotas
   - Monitor Supabase connection health

This implementation provides a solid foundation for natural, intelligent coaching conversations while maintaining strict quality controls and user experience standards.