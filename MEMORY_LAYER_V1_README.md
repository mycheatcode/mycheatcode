# Memory Layer V1 Implementation

## Overview

The Memory Layer V1 provides persistent storage and business logic for the basketball mental performance coaching app. It implements the complete data model, API endpoints, growth mechanics, and maintenance jobs as specified.

## Database Schema

### Tables Created

1. **users** - User profiles with handles
2. **sessions** - Chat sessions by section
3. **messages** - Chat message history
4. **codes** - Mental performance cheat codes
5. **logs** - Code usage tracking
6. **section_progress** - Section-level progress and green hold tracking
7. **radar_state** - Overall radar visualization data

### Key Features

- **Row Level Security**: All tables have RLS policies ensuring users can only access their own data
- **Enums**: Type-safe enums for sections, colors, message roles, and code status
- **Indexes**: Performance-optimized indexes for common queries
- **Constraints**: Data integrity with check constraints and foreign keys

## API Endpoints

### POST /api/chat
Creates chat sessions and saves messages.

```typescript
Request: {
  section: 'pre_game' | 'in_game' | 'post_game' | 'locker_room' | 'off_court',
  message: string
}

Response: {
  session_id: string,
  message: Message
}
```

### POST /api/codes
Creates new cheat codes with automatic validation.

```typescript
Request: {
  section: SectionType,
  name: string,
  one_line: string
}

Response: {
  code: Code,
  active_codes_count: number
}
```

**Validation**:
- Max 7 active codes per section
- Name max 100 chars, one_line max 500 chars

### POST /api/logs
Logs code usage with complete progression updates.

```typescript
Request: {
  code_id: string
}

Response: {
  log: Log,
  code: Code,
  section_progress: SectionProgress,
  radar_state: RadarState,
  should_count: boolean
}
```

**Features**:
- Daily cap enforcement (3 counted logs per section)
- Growth calculation with honeymoon bonuses
- Automatic section progression updates
- Radar recalculation

### GET /api/progress
Retrieves complete user progress data.

```typescript
Response: {
  radar_state: RadarState,
  section_progress: SectionProgress[]
}
```

## Growth & Progression System

### Code Power Growth
- **Logs 1-3**: +20% each
- **Logs 4-6**: +10% each
- **Logs 7-10**: +5% each
- **Logs 11+**: +2-3% each (random, cap at 100%)

### Honeymoon Bonus
- **Trigger**: First 7 days OR first 10 logs per section
- **Effect**: +25% bonus to growth amount

### Section Promotion Rules
- **Red → Orange**: ≥2 logs, ≥1 code
- **Orange → Yellow**: ≥6 logs, ≥2 codes
- **Yellow → Green**: ≥12 logs, ≥3 codes

### Decay System
- **Trigger**: No usage for 48+ hours
- **Effect**: -5% power per day
- **Frequency**: Daily at midnight (configurable)

### Green Hold Maintenance
- **Requirement**: 4 active days in any 7-day window
- **Grace Period**: 2 days before demotion
- **Check**: Daily at noon (configurable)
- **Demotion**: Green → Yellow if requirements not met

## File Structure

```
/lib/
  supabase.ts           # Supabase client configuration
  types.ts              # TypeScript types and constants
  memory-layer.ts       # Core business logic functions
  maintenance-jobs.ts   # Decay and green hold maintenance
  database.sql          # Complete database schema

/app/api/
  chat/route.ts         # Chat session management
  codes/route.ts        # Code creation endpoint
  logs/route.ts         # Code usage logging
  progress/route.ts     # Progress data retrieval
  maintenance/route.ts  # Maintenance job triggers
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret_for_maintenance_jobs
```

## Security Features

### Authentication
- All endpoints require valid Supabase auth
- Row Level Security on all tables
- User ownership validation on all operations

### Rate Limiting (Recommended)
- Chat: 60 requests/hour/user
- Logs: 3 requests/day/section (enforced by business logic)

### Data Validation
- Input sanitization and length limits
- Section and status enum validation
- Ownership verification for all operations

## Maintenance Jobs

### Decay Job (Midnight)
```bash
# Manual trigger
curl -X POST "https://your-app.com/api/maintenance?job=decay" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Green Hold Check (Noon)
```bash
# Manual trigger
curl -X POST "https://your-app.com/api/maintenance?job=green-hold" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Combined Jobs
```bash
# Run all maintenance
curl -X POST "https://your-app.com/api/maintenance?job=all" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Setup Instructions

1. **Database Setup**
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy and paste contents of /lib/database.sql
   ```

2. **Environment Configuration**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   CRON_SECRET=your_secret
   ```

3. **Cron Jobs** (External Service)
   ```bash
   # Daily at midnight (decay)
   0 0 * * * curl -X POST "https://your-app.com/api/maintenance?job=decay" -H "Authorization: Bearer YOUR_SECRET"

   # Daily at noon (green hold)
   0 12 * * * curl -X POST "https://your-app.com/api/maintenance?job=green-hold" -H "Authorization: Bearer YOUR_SECRET"
   ```

## QA Checklist

✅ **Chat System**
- Creates sessions and saves messages
- Handles section validation
- Manages session states

✅ **Code Management**
- Creates codes with validation
- Enforces 7-code limit per section
- Returns proper error messages

✅ **Logging System**
- Increments code power correctly
- Updates section progress
- Recalculates radar state
- Respects daily caps

✅ **Progression Rules**
- Guardrails enforced for promotions
- Growth curves implemented
- Honeymoon bonuses applied

✅ **Decay System**
- Reduces power after 48h idle
- Updates section/radar states
- Runs via maintenance endpoint

✅ **Green Hold System**
- Tracks maintenance requirements
- Implements grace periods
- Demotes after grace expiry

✅ **Data Integrity**
- RLS policies protect user data
- Ownership validation on all operations
- Type safety with TypeScript

## Testing

### Manual API Testing

```bash
# Test chat
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"section":"pre_game","message":"Hello"}'

# Test code creation
curl -X POST "http://localhost:3000/api/codes" \
  -H "Content-Type: application/json" \
  -d '{"section":"pre_game","name":"Focus","one_line":"Stay focused"}'

# Test logging
curl -X POST "http://localhost:3000/api/logs" \
  -H "Content-Type: application/json" \
  -d '{"code_id":"uuid-here"}'

# Test progress
curl "http://localhost:3000/api/progress"
```

## Future Enhancements (V2)

- **Embeddings**: Add vector search for messages and codes
- **Analytics**: Usage patterns and performance metrics
- **Social**: Leaderboards and sharing features
- **ML**: Personalized recommendations
- **Real-time**: WebSocket updates for live progress

## Troubleshooting

### Common Issues

1. **Auth Errors**: Check Supabase configuration and RLS policies
2. **Daily Limit**: Verify timezone settings for maintenance jobs
3. **Performance**: Add additional indexes if queries are slow
4. **Data Consistency**: Ensure maintenance jobs run reliably

### Monitoring

- Monitor maintenance job execution logs
- Track API response times and error rates
- Monitor database connection pool usage
- Alert on failed maintenance jobs

This implementation provides a robust foundation for the Memory Layer with room for expansion while maintaining data integrity and performance.