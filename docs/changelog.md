# Changelog


### June 17, 2025
- Setup the readme file with basic details about the project
- Added taskmaster using the one line command into the browser (for Cursor 1.0+)
- Started taskmaster with the default initialize prompt

### June 18, 2025
- After unsuccessfully trying to get taskmater to run, just skipped it entirely for now
- Setup Vercel
- Added Supabase CLI as an npm dependency so that I can use the CLI and git to save the db structure, RLS policies, etc. and others can quickly implement the db and auth from this repo.
- Important: Docker needs to be installed in the local machine to use Supabase CLI and run locally (See:https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=npm for more details)
- 

### June 26, 2025
- created a rough homepage.
 Next steps:
- move the nav to its own component
- Improve the copy, theming and colors

Because the homepage doesn't face much of a technical risk, it's a lower priority. Focusing on the more challenging aspects: auth, tenancy, and first feature to ship.
