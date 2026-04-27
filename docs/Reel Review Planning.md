# **Reel Review: Master Project Plan**

**Core Premise:** A synchronized weekly event where the byNolo community watches and rates one specific movie.

## **1\. The Weekly Lifecycle (The Loop)**

* **The Schedule:** The new movie is revealed on **Monday**. Voting locks on **Sunday at 11:59 PM**.  
* **Stat Visibility:** Live stats (averages) are strictly **hidden** during the active week to prevent bias. Users can only see the *total number of users who have voted*. Results are revealed on Monday alongside the new movie drop.  
* **Mid-Week Discussion:** Users need a place to discuss the movie *before* Sunday night.  
* **Spoiler Protection:** Two distinct sections for comments/reviews: "Spoiler-Free" and "Spoiler Zone" (with prominent warnings).  
* Users can flag messages that break the rules (e.g., posting spoilers in the free zone) for admin review or spoiler tagging.

## **2\. Movie Selection (The Curator)**

We will support multiple "Modes" for selecting the weekly movie to keep the community engaged:

* **Admin Pick:** Direct selection by the admin.  
* **User Vote:** Community votes on a short-list (e.g., pick 1 of 3 options for next week).  
* **Random Pool:** Random pull from the user-suggested queue.  
* **Theme Week/Month:** Admin sets a theme (e.g., "Spooky Season", "Sci-Fi September"), users nominate, and the system pulls from those.  
* **Algorithmic:** System analyzes the suggestion queue and picks movies optimized for maximum engagement/debate.

## **3\. The Rating Mechanics**

* **The Scale:** 0 \- 100 (in increments of 10). This avoids messy decimals while giving the illusion of a deeper grading scale.  
* **Core Inputs:** \* Overall Score (Required)  
* "Watched" Status toggle  
* **Late Votes (Fluid Scoring):** Ratings submitted after the Sunday deadline are flagged as "Late" in the database, but they *do* actively update the official community average. This keeps the Archive's scores fluid and accurate over time.  
* **Optional Sub-Categories:** Story, Performances, Visuals, Sound, Rewatchability, Enjoyment, Emotional Impact.  
* **Text Reviews:** Users can leave written reviews.  
* Supports Anonymous posting.  
* System utilizes auto-moderation with a manual admin review queue for flagged content.

## **4\. Community & Social Features**

* **User Profiles:** **Private by default.** Users must opt-in to make their profile public. They can configure exactly which stats/lists are publicly visible.  
* **The Archive ("The Film Shelf"):** A comprehensive database of all past weeks, styled like a premium streaming service.  
  * The "Shelf" Paradigm: Movies are displayed in horizontal, scrollable rows (Shelves) categorized by themes, genres, and leaderboards.  
  * Dynamic Sorting: The vertical order of the shelves changes periodically (via backend algorithm) to keep content fresh and drive discovery.  
  * Shelf Types: "Missed By You", "Top Rated Overall" (Leaderboard), "Because you liked \[Movie\]", "Chronological", "Most Divisive", "Your Favorites", etc.  
* **Watch Parties (LFG System):** A bulletin board system to help users bypass streaming fragmentation.  
  * No native video hosting.  
  * Users can post hosting links (Discord, Teleparty) or organize in-person meetups.  
  * Includes tools for users to find/vote on the best time to schedule a watch party.

## **5\. Ecosystem & Gamification**

* **Authentication:** Integrated directly with **KeyN**.  
* **Alerts:** Integrated directly with **Nolofication** (Triggers: Monday Drop, Weekend Voting Reminder, Monday Results Reveal).  
* **Engagement Drivers (Tiered System):** \* **Streaks:** Tracking consecutive weeks voted.  
* **Leveled Badges:** Achievements that can be "leveled up" (e.g., Level 1, Level 2, Level 3 based on action counts).  
* **The Intermission Economy (Streak Freezes):**  
  * Users receive a flat baseline rate of "Intermissions" per year.  
  * Highly active users can unlock additional Intermissions by participating in the community.  
* **The Redirection Hook:** When a user triggers an Intermission, the system prompts them with an algorithmic recommendation from the Film Shelf that they haven't rated yet.

## **6\. Data Management & TMDB Integration**

* **Static Metadata:** When an admin approves/adds a movie, Reel Review fetches cast, crew, synopsis, and poster data from TMDB *once* and stores it internally.  
* **Dynamic Metadata (Where to Watch):** Streaming availability is pulled periodically. We will attempt to detect the user's region via KeyN or manual prompt, defaulting to **Canada** as the primary region.  
* **Custom Movie Input:** Admins have the ability to manually input a movie entirely (bypassing TMDB). Only admins can upload custom image files, ensuring low storage overhead and high security.

## **7\. Onboarding, Insights & Catch-Up Mechanics**

* **Preference Matrix:** During onboarding (and editable anytime), users input their cinematic preferences to fuel the prediction engine:  
  * Favorite Genres, Actors/Directors, Tropes.  
  * Top 3 favorite movies of all time.  
* **The Starter Pack:** New users are heavily prompted to rate at least one past movie from the archive before voting on the current week to learn the UI.  
* **Missed Weeks:** Existing users can always go back and rate movies from previous weeks that they missed.  
* **Insights & "Reel Wrapped":** \* Baseline insights (e.g., user avg vs. community avg) are available year-round.  
  * Deep algorithmic insights are reserved for a seasonal or end-of-year "Reel Wrapped" event.

## **8\. Admin Dashboard (Day 1 MVP)**

The core operational hub for platform management must include:

* **Movie Management:** Adding movies via TMDB or via Custom Manual Input (w/ image uploads). Triggering/scheduling the weekly swap.  
* **Moderation:** Queue for reviewing flagged comments and reviews.  
* **User Management:** Viewing/managing accounts.  
* **Analytics:** High-level site stats (traffic, active users) and vote stats (engagement rates).

## **9\. Hosting & Monetization**

* **Infrastructure:** Self-hosted on the byNolo Proxmox server (PostgreSQL database, FastAPI backend, React/Vite frontend).  
* **API Usage:** TMDB API (Free tier/Non-commercial).  
* **Monetization:** Strictly non-commercial project.  
  * An optional "Support the Server" link will be available.  
  * Supporters receive an exclusive, purely cosmetic profile badge.

## **10\. Post-MVP Roadmap (Future Features)**

* **Global Activity Feed:** A scrolling feed on the homepage showing when users rate past movies, hit new streak milestones, or post (non-spoiler) reviews.

