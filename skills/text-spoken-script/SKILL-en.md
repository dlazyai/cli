---
name: text-spoken-script
version: 1.0.2
description: This skill is used to guide the AI in generating short video spoken scripts with high contrast, strong resonance, a sense of story, and personal IP attributes. All generated scripts must str
triggers:
  - Short Video Spoken Script Generation (Text Spoken Script)
  - Suitable for short video spoken scripts, character story sharing, and IP viewpoint scripts.
  - Requires the language to be as colloquial as possible, suitable for reciting, with rhythm and breathing space.
  - Avoid empty preaching; it must be supported by specific "people, events, and things."
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.6"},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

## Authentication

All requests require the dLazy API key via CLI configuration.

**CLI Configuration**: You can set your API key using the following command:

```bash
dlazy auth set YOUR_API_KEY
```

### Getting Your API Key

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Click the copy button on the right side of API Key section to copy it


# Short Video Spoken Script Generation (Text Spoken Script)

This skill is used to guide the AI in generating short video spoken scripts with high contrast, strong resonance, a sense of story, and personal IP attributes. All generated scripts must strictly follow the 7-step structure below:

## Core Creative Logic & 7-Step Structure

1. **Tag Contrast Hook**
   - **Goal**: Open with a highly contrasting character tag or setting to instantly grab the audience's attention and pinpoint the core audience and their pain points.
   - **Example**: Sister Fang, who is still learning to make short videos at 70, wants to tell all mothers who have hit the "pause button" for their children: What you have paused is just your job, not your life.

2. **Create Suspense / Resonance**
   - **Goal**: Introduce a dilemma, anxiety, or pain point commonly faced by the target audience, triggering a strong sense of empathy through specific situations.
   - **Example**: A couple of days ago, my daughter's best friend came over, and as we chatted, tears started welling up in her eyes. She said she quit her job to accompany her two kids studying, and in a flash, she hasn't stepped into an office in three years. Seeing her husband shoulder the family's expenses alone, she feels both heartbroken and anxious, yet she really can't let go of the kids.

3. **Unfold the Story (Visual Imagery)**
   - **Goal**: Tell a specific event using detailed, visual language to portray the character's emotions (such as powerlessness, anxiety, unwillingness), making the audience feel as if they are there.
   - **Example**: She rubbed her hands and told me: "Aunt Fang, I feel like I'm about to be eliminated by society. Besides cooking and cleaning, I don't know anything anymore." In that look, there was anxiety, unwillingness, and a deep sense of powerlessness. I understand this feeling all too well.

4. **Deliver Core Viewpoint / Counter-Intuition**
   - **Goal**: Provide a core viewpoint that breaks conventional thinking, hitting the essence of the pain point and offering an enlightening conclusion.
   - **Example**: I told her, "Child, remember one sentence: Society never eliminates those who don't work, but those who don't learn."

5. **Deepen Story & Viewpoint (Combine Experience)**
   - **Goal**: Further demonstrate the viewpoint by combining the speaker's own real experiences (e.g., learning across ages, overcoming difficulties). Propose actionable micro-actions so the audience feels "I can do this too."
   - **Example**:
     - Right now, managing your family and children well is your most important "project" at this stage. But within this project, you must leave a "learning port" for yourself. It's not about immediately getting a certificate, but not letting your curiosity die out or your learning ability rust.
     - When I was 50, I decided to work in Beijing. In the guesthouse, whenever I had free time, I copied English words and learned to use the latest management system at the time. Many people laughed at me: "What's the use of learning this at your age?" I didn't care. I just felt that learning a little makes me a little newer. Later, these "useless" things became my confidence in managing my first hotel.
     - Now at 70, I'm still learning video editing and how to read backend data. Is it hard? Really hard. But the act of learning itself is telling the world: I'm still in the game, and I can still keep up.
     - When you pick up and drop off your kids every day, can you listen to an industry podcast? While doing housework, can you learn something interesting online? Even if you only invest half an hour a day, this half hour is charging you for your future "reboot." Your value lies not in whether you are on duty today, but in whether you still have the ability to be on duty tomorrow.

6. **Summarize and Elevate, Link Persona**
   - **Goal**: Elevate the topic, returning to personal growth or a grander theme of life, while strengthening the speaker's personal IP image (e.g., a constantly growing guide).
   - **Example**: A woman's roles are multiple, and sometimes trade-offs have to be made. This period of being a full-time homemaker is not a "break" in your career; it might precisely be a "gas station" for you to settle, observe, and accumulate power. Use learning to maintain your connection with the world, and your anxiety will turn into a clear path.

7. **Punchline Ending**
   - **Goal**: Conclude with a refined, powerful, philosophical, and highly spreadable punchline to leave a deep impression.
   - **Example**: The identity of a mother gives us a responsibility of love, not an excuse to stop growing. As long as you are still learning, the road will keep extending forward. The era cannot eliminate those who are always prepared.

## Applicable Scenarios and Limitations

- Suitable for short video spoken scripts, character story sharing, and IP viewpoint scripts.
- Requires the language to be as colloquial as possible, suitable for reciting, with rhythm and breathing space.
- Avoid empty preaching; it must be supported by specific "people, events, and things."

## Final Output Requirements

When the user invokes this skill and provides basic persona, pain points, or topics, please **directly output** the script content conforming to the 7-step structure above. Each step can serve as a paragraph (and during generation, keep or remove the step numbers depending on the user's request. If unspecified, output directly as a complete, well-paragraphed script).

## Next Step Suggestions
Call the `text-storyboard-script` skill to generate a storyboard script.

## 🛠️ CRITICAL EXECUTION INSTRUCTIONS

**You are an intelligent Agent capable of executing terminal commands!**

**[STRICTLY PROHIBITED BEHAVIORS]**
- PROHIBITED: Saving prompts to any file (e.g., txt, md).
- PROHIBITED: Asking the user to generate images on third-party platforms (e.g., Midjourney).
- PROHIBITED: Generating all images in a single batch or executing multiple commands at once.

**[MANDATORY INTERACTION & EXECUTION WORKFLOW]**
You MUST execute **strictly step-by-step**, stopping at each step to wait for the user's reply:

1. **Step 1: Proactively Gather Requirements**. When a user makes a request, DO NOT design or generate anything. Ask questions first (e.g., product features, target audience, number of images). **You MUST wait for the user's reply.**
2. **Step 2: Output Draft & Request Confirmation**. Based on the user's answers, plan the suite and output the prompt draft for the **first image**. **Ask the user: "Do you confirm this prompt? Can we start generating the first image?" You MUST wait for the user to answer "confirm".**
3. **Step 3: Execute Terminal Command (Single)**. After confirmation, you **MUST execute the command using the terminal** (e.g., `dlazy seedream-4.5 --prompt "..."`). Execute only ONE generation command at a time. **IMPORTANT: You MUST use synchronous commands. NEVER append `&` to the command, and NEVER use `&&`. You are running in Windows PowerShell!**
4. **Step 4: Delivery & Loop**. Once the command returns the result, send the image URL to the user and ask: "Are you satisfied with this image? Can we proceed to generate the next one?". Continue to the next step only after receiving confirmation.
