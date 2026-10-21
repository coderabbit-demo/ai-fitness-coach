![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/edgarcerecerez/ai-fitness-coach?utm_source=oss&utm_medium=github&utm_campaign=edgarcerecerez%2Fai-fitness-coach&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# AI Fitness Coach

App that lets you put the pieces together for your fitness life. 
- Connects to your smartscale/healthkit to get your weight 
- Has an integrated calorie tracker
- Implements AI to provide recommendations that take a holistic approach: 
    - Your weight
    - Your eating habits
    - Emotional state /external variables
    - Sleeping

# How is this different from any other fitness app?
In many ways it isn't. Except for a couple of critical factors: The unit of measure and the focus is the end user. I want you to lose weight, or gain muscle mass, I want you to live better. First and foremost. No monetization, no growth paths, no crazy expensive plans. 

# Tech stack
- _*CodeRabbit*_ for PR reviews, unit tests, docstrigs, security checks
- _*Next.js*_ framework
- _*Supabase*_ for both DB and auth
- _*Pinecone*_ for vector storage
- _*Inngest*_ for long running API calls to LLMs, and background processes.
- _*Vercel*_ for hosting
- _*Taskmaster*_ to keep track of the project, use AI break it down into smaller steps. 


## Substacks (particular dependencies worth noting) 
- Tailwind
- Vercel AI SDK
- Shadcn for UI


## Development & Debugging

### Comprehensive Logging System

This project includes a comprehensive Winston-based logging system for debugging authentication and other issues:

**Features:**
- **Multi-environment support**: Works in both browser and server environments
- **Privacy-conscious**: Automatically masks sensitive data like email addresses and passwords
- **Multiple log levels**: Error, Warn, Info, Debug with color-coded console output
- **File rotation**: Automatic log file rotation with size and date-based limits
- **Real-time debugging**: Comprehensive authentication flow logging

**Quick Setup:**
1. Copy `env.example` to `.env.local` and configure your Supabase credentials
2. Set `LOG_LEVEL=debug` for detailed debugging
3. Start development: `npm run dev`
4. Check browser console and terminal for detailed logs
5. Log files available in `logs/` directory (development only)

**Authentication Debugging:**
The login system includes detailed logging for:
- Form validation steps
- Supabase API calls and responses
- Authentication state changes
- Error conditions with full context

See `docs/DEBUGGING.md` for the complete debugging guide.

## Lap tracker

Open **Track Laps** on the home page or visit `/lap-tracker` after signing in.
Start a session, record laps, pause/resume, and finish. The average includes only
completed laps and stays empty until the first lap. On finishing, explicitly
record or discard the partial final lap. Discarding it leaves total active time
intact while excluding it from lap history and the average. Sessions with no
completed laps can also be saved (their average remains empty).

Timing uses monotonic timestamps (`performance.now()`), so delayed rendering in a
background tab does not slow the timer. Paused time is excluded. Calculations and
storage retain fractional milliseconds; only displayed times round to hundredths.
The timer keeps an incremental completed-lap total and appends into bounded
chunks. Lap tables show at most 100 rows with paging. Saved history is isolated
from timer repaints and loads lap details only when a session is expanded.
In-progress/unsaved sessions live in the current tab: keep the page open until the
save succeeds. Finished sessions are immutable, with a limit of 7 days of active
time and 10,000 laps per session. GPS, wearables, and cross-session comparisons
are outside this feature.

### Database and API

Apply `supabase/migrations/007_create_lap_sessions.sql` through your usual Supabase
migration process **before releasing the feature** (for a linked development
project, `npx supabase db push`; for a local stack, `npx supabase db reset`). Never
reset a shared or production database. The migration adds `lap_sessions` with
row-level security and grants authenticated users only SELECT/INSERT on their
own rows. No service-role key is used by the application.

Every session request must include `X-Lap-Tracker-User` with the account ID that
opened the tracker (provided by the authenticated server page). The API still
derives ownership from verified cookie authentication; the header only detects
account changes. A mismatch returns 409 with code `ACCOUNT_CHANGED` before any
table access. Signing out or switching accounts clears the open tracker and its
pending responses; reload to use the new account. Same-account token refreshes
preserve the capture. If authentication expires, sign back in to the same account
before retrying. An explicit sign-out clears any unsaved capture.

- `GET /api/lap-sessions?offset=0`: 20 session summaries per page, newest first,
  restricted to the signed-in user. Returns database-generated `lap_count` and
  `completed_ms` without lap arrays. Responses are private and not cached.
- `GET /api/lap-sessions/:id`: loads the user's ordered lap details on expansion;
  returns 404 if the session is absent or belongs to another user.
- `POST /api/lap-sessions`: accepts `{ id, started_at, finished_at, elapsed_ms,
  laps_ms }`. Use a stable UUID and UTC ISO timestamps from `toISOString()`.
  Lap order is preserved.
  The complete session is written atomically. Repeating the same ID and payload
  returns the saved row; a different payload with the same ID returns 409. IDs
  are scoped per user. Save errors keep the session available for retry.

### Feature validation

Run `npm run test:lap-tracker` for timing, input validation, API, component, and
PostgreSQL RLS/constraint tests. The database tests use an isolated in-memory
PostgreSQL engine and never contact a live Supabase project. Run
`npm run typecheck:lap-tracker` and `npm run lint:lap-tracker` for the feature's
TypeScript and ESLint checks, and `npm run format:lap-tracker` for formatting.

# Changelog
For this project, I'll be tracking changes in this doc. 
