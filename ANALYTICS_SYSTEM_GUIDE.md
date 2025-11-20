# MyCheatCode Analytics System

## Overview

Custom analytics system built specifically for tracking basketball mental coaching app behavior. All data is owned by you, stored in your Supabase database, and will work seamlessly when you build the mobile app.

## What's Been Built

### 1. Database Table (`analytics_events`)
Stores all user behavior events with:
- Event name (e.g., `cheat_code_created`, `practice_game_completed`)
- Event category (`activation`, `engagement`, `retention`, `feature_usage`)
- Custom properties (JSON) for event-specific data
- User ID, session ID, page URL, timestamp
- Optimized with indexes for fast queries

### 2. Analytics Library (`/lib/analytics.ts`)
Easy-to-use functions for tracking events:

```typescript
import { Analytics } from '@/lib/analytics';

// Track cheat code creation
Analytics.trackCheatCodeCreated(codeId, isFirstCode, topic);

// Track practice game
Analytics.trackPracticeGame(gameId, completed, score);

// Track feedback
Analytics.trackFeedbackSubmitted(type, hasRatings, hasScreenshot);

// Track page views (automatic)
Analytics.trackPageView('Coach Chat');
```

### 3. Auto-Tracking (`/components/AnalyticsProvider.tsx`)
Automatically tracks:
- **Session starts** - When user opens the app
- **Page views** - Every page navigation
- **User sessions** - Groups events into browsing sessions

### 4. Admin Dashboard (`/app/admin/analytics`)
View insights at a glance:
- **Key Metrics**: Total events, unique users, DAU, WAU
- **Daily Engagement**: 7-day chart showing user activity
- **Top Events**: Most common user actions
- **Category Breakdown**: Activation vs Engagement vs Retention
- **Time Filters**: 7 days, 30 days, or all time

## Key Events Being Tracked

### Activation (Onboarding)
- `onboarding_started` - User enters onboarding
- `onboarding_completed` - User finishes onboarding
- `scenario_selected` - Which scenarios users pick
- `first_cheat_code_created` - Time to value!

### Engagement (Core Features)
- `cheat_code_created` - New cheat code generated
- `cheat_code_regenerated` - User wasn't happy, regenerated
- `cheat_code_favorited` - User marked code as favorite
- `cheat_code_used` - User logged using a code
- `practice_game_started` - Started practice scenario
- `practice_game_completed` - Finished practice scenario
- `chat_message_sent` - Talked to coach

### Feature Usage
- `feedback_submitted` - User gave feedback
- `page_view` - Page navigation
- `momentum_milestone` - Hit momentum goal
- `streak_maintained` - Kept their streak alive

### Retention
- `session_start` - User returned to app
- `daily_return` - User came back same day
- `streak_broken` - Lost their streak

## How to Add More Tracking

### 1. Add event name to the library:
```typescript
// In /lib/analytics.ts
export const EventName = {
  // ... existing events
  MY_NEW_EVENT: 'my_new_event',
};
```

### 2. Create a convenience function:
```typescript
// In /lib/analytics.ts
export const Analytics = {
  // ... existing functions
  trackMyNewEvent: (someData: string) => {
    trackEvent(
      EventName.MY_NEW_EVENT,
      { some_data: someData },
      EventCategory.ENGAGEMENT
    );
  },
};
```

### 3. Call it from your component:
```typescript
import { Analytics } from '@/lib/analytics';

const handleButtonClick = () => {
  Analytics.trackMyNewEvent('test data');
  // ... rest of your code
};
```

## Setup Instructions

### 1. Run the Database Migration

Go to your Supabase Dashboard → SQL Editor:

```sql
-- Run the migration from:
-- /supabase/migrations/20251120000001_create_analytics_events.sql
```

Or copy the SQL from that file and run it.

### 2. That's It!

The analytics system is already integrated into your app:
- Page views are tracked automatically
- Sessions are tracked automatically
- Feedback submissions are tracked automatically
- Add more tracking as you build features

### 3. View Your Analytics

Go to: `http://localhost:3000/admin/analytics` (or your production URL)

You'll see:
- Real-time user activity
- Engagement patterns
- Feature usage statistics
- Retention metrics

## What Analytics Tell You

### For Beta Testing
- **Which features users discover** - Are they finding practice games?
- **Where users drop off** - Do they abandon onboarding?
- **What content works** - Which scenarios are most popular?
- **Coach quality signals** - Are users regenerating codes (unhappy)?

### For Mobile App Design
- **Most-used features** - Prioritize these in mobile UI
- **User flow patterns** - Design navigation based on real usage
- **Engagement drivers** - What makes users come back?
- **Conversion funnels** - Onboarding → First code → Retention

### For Monetization
- **Power users** - Who creates many codes? (premium target)
- **Feature value** - Which features drive retention? (paywall here)
- **Drop-off points** - Where do free users lose interest? (conversion opportunity)

## Why This Is Better Than Google Analytics

1. **Basketball-specific metrics** - Track "cheat code effectiveness", not just pageviews
2. **Works in mobile app** - Same database, same tracking when you go iOS/Android
3. **Own your data** - Critical for understanding conversion when monetizing
4. **No privacy concerns** - Not sending behavior to Google
5. **Custom queries** - Can build any report you want from raw data
6. **No limits** - Google Analytics has sampling limits, this doesn't

## Advanced: Custom Queries

Since all data is in your Supabase database, you can run custom SQL queries:

```sql
-- Find users who created 5+ cheat codes
SELECT user_id, COUNT(*) as codes_created
FROM analytics_events
WHERE event_name = 'cheat_code_created'
GROUP BY user_id
HAVING COUNT(*) >= 5;

-- See what topics users ask about most
SELECT properties->>'topic' as topic, COUNT(*) as frequency
FROM analytics_events
WHERE event_name = 'chat_message_sent'
  AND properties->>'topic' IS NOT NULL
GROUP BY topic
ORDER BY frequency DESC;

-- Calculate retention rate (% of users who return after 7 days)
SELECT
  (COUNT(DISTINCT CASE WHEN days_since_first >= 7 THEN user_id END)::float /
   COUNT(DISTINCT user_id)::float * 100) as retention_7d
FROM (
  SELECT
    user_id,
    EXTRACT(DAY FROM (MAX(created_at) - MIN(created_at))) as days_since_first
  FROM analytics_events
  GROUP BY user_id
) subquery;
```

## Next Steps

1. **Run the migration** in production Supabase
2. **Monitor analytics** at `/admin/analytics`
3. **Add more events** as you build new features
4. **Use insights** to guide mobile app development

## Questions to Answer with Analytics

- Which onboarding scenarios are most popular?
- Do users who play practice games create more cheat codes?
- What's the average time from signup to first cheat code?
- Do users who favorite codes have better retention?
- Which topics do users ask the coach about most?
- What's the dropout rate in onboarding?
- How many users maintain 7-day streaks?

All of these can be answered with the data you're now collecting!
