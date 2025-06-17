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
 
