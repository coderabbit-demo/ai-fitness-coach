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

# Changelog
For this project, I'll be tracking changes in this doc. 
