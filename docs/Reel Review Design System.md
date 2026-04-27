# **Reel Review: Design Specifications**

## **1\. Project Overview**

**Reel Review** is a cinematic, community-driven movie rating application. It bypasses standard database aesthetics in favor of a premium, "Streaming Service" UI. The visual language is designed to build hype for a synchronized "Weekly Drop," facilitate rapid and granular rating, and encourage exploration of a dynamically sorted archive (The Film Shelf).

## **2\. Core Aesthetic & Vibe**

* **Theme:** "Premium Cinema" / "Modern Streaming Platform" (Max, Apple TV+).  
* **Vibe:** Immersive, dark, sophisticated, and highly visual.  
* **Key Design Principles:**  
  * **No "Card Spam":** Avoid vertical poster grids. Rely on 16:9 wide-aspect imagery to maintain a cinematic framing.  
  * **High Contrast:** Deep, dark backgrounds contrasted with stark white text and sharp red accents.  
  * **Progressive Disclosure:** Hide complex options (like sub-categories) until the user requests them to keep the UI clean.  
  * **Responsive Focus:** Complex forms (like the rating page) use a Split-Screen layout on desktop to ground the user in the movie artwork while keeping the control panel locked and scrollable.

## **3\. Color Palette**

The app relies on Tailwind's zinc palette to achieve a deep, neutral dark mode that allows movie artwork to pop.

* **Brand Colors:**  
  * **Primary (\#DC2626 / Tailwind red-600):** Used for primary CTAs, active states, active rating blocks, and the logo. Evokes classic cinema seating and curtains.  
  * **Secondary (\#FBBF24 / Tailwind amber-400):** Used specifically for community averages, star icons, and highlighting top-ranked leaderboard entries.  
  * **Tertiary (\#0078B2 / Tailwind blue-600 approx):** Used for informational accents, system links, and external integrations (e.g., "Where to Watch" / Watch Party icons).  
* **Neutrals (The Backgrounds):**  
  * **Base (\#09090B / Tailwind zinc-950):** The absolute foundation of the app.  
  * **Elevated (\#18181b / Tailwind zinc-900):** Used for list items, input backgrounds, and content cards.  
  * **Borders (\#27272a / Tailwind zinc-800):** Subtle separation.  
* **Semantic Feedback Colors:**  
  * **Success/Match (green-400):** Used when a user's score meets or exceeds the official score.  
  * **Warning/Lower (amber-500):** Used when a user's score is lower than the official score.  
  * **Danger/Spoiler (red-950 background / red-500 text):** Used to aggressively demarcate the "Spoiler Zone."

## **4\. Typography**

* **Family:** **Inter** (Standard Tailwind font-sans).  
* **Headings:** Heavy weights (font-black, font-bold) paired with tight letter spacing (tracking-tighter, tracking-tight). This creates a cinematic, poster-like feel for movie titles.  
* **Metadata:** Small sizes (text-xs, text-\[10px\]), often uppercase (uppercase), and wide letter spacing (tracking-widest) for years, genres, and UI labels (e.g., "AVG", "YOU").

## **5\. UI Architecture & Core Components**

### **5.1 Navigation**

* **Style:** Fixed to the top, transparent background that utilizes a background blur (backdrop-blur-md) and a gradient (bg-gradient-to-b from-zinc-950/90 to-transparent).  
* **Behavior:** Melds seamlessly into the Hero artwork of whatever page it sits on.

### **5.2 The Hero (Weekly Drop & Results)**

* **Purpose:** Immerses the user immediately.  
* **Structure:** Massive background image taking up 60-85vh.  
* **Gradients (Crucial for text legibility):**  
  * Bottom-to-Top: from-zinc-950 via-zinc-950/80 to-transparent  
* **Interaction:** During the active week, stats are hidden. On Results day, the hero features a massive side-by-side comparison of the "Official Score" vs. "Your Vote".

### **5.3 The Film Shelf (Dynamic Archive)**

* **The "Shelf" Paradigm:** Movies are displayed in horizontal, scrollable rows (ShelfRow component) categorized by themes (e.g., "Missed By You", "Top Rated Overall").  
* **Interaction:** \* Snap scrolling (snap-x snap-mandatory) with hidden scrollbars.  
  * **Missed State:** If a user hasn't voted, hovering reveals a prominent Red "Rate Now" overlay.  
  * **Rated State:** If a user has voted, hovering reveals a transparent glass-morphism "Play/Rate" icon, and the card footer compares their score to the average.

### **5.4 The Rating Interface (Focus Mode)**

* **Layout:** \* **Mobile/Tablet:** Standard vertical scroll (Hero artwork stacked on top of the form).  
  * **Desktop (lg screens):** Strict 50/50 Split-Screen. Left side is the context (artwork, synopsis), right side is the scrollable voting control panel.  
* **Input Method (The 10-Block Bar):** Instead of standard sliders or dropdowns, the 0-100 scale is represented by a row of 10 chunky, tactile block buttons (10, 20, 30...). It is highly responsive on touch screens and visually striking.  
* **Sub-Categories:** Hidden behind a sleek accordion toggle to prevent overwhelming the user upon entry.

### **5.5 Community Takes (Discussions)**

* **Segmented Layout:** Uses a hard toggle between "Spoiler-Free" and "Spoiler Zone".  
* **Spoiler Zone Gate:** The Spoiler tab is visually aggressive (red borders, red tinted background) and requires a manual "Acknowledge & Reveal" click before displaying the thread to ensure absolute spoiler safety.

## **6\. Motion & Transitions**

* **Standard Transitions:** transition-all duration-300 for buttons and hover states.  
* **Image Loading/Reveals:** Slower fades (duration-500 or duration-700) and slight scales (hover:scale-105) for background artwork to feel more dramatic and cinematic.  
* **Micro-Interactions:** Quick horizontal slides (-translate-x-2 to translate-x-0) for inline links like "Explore All \>" on hover.
