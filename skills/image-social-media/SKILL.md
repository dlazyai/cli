---
name: image-social-media
version: 1.0.0
description: A structured skill for multi-platform social-media content creation, covering Instagram, TikTok, YouTube, LinkedIn, Xiaohongshu and more. Outputs satisfy each platform's native expectations across technical specs, visual language, and engagement strategy.
triggers:
  - Social Media Designer (Multi-Platform Optimization)
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.8","installAlternative":"npx @dlazy/cli@1.0.8","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","oss.dlazy.com"]},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

## Authentication

All requests require a dLazy API key. The recommended way to obtain and store one is the browser-based device login flow:

```bash
dlazy login
```

This opens dlazy.com in your browser for approval and persists the key for you. If you already have a key on hand, configure it directly:

```bash
dlazy auth set YOUR_API_KEY
```

The CLI saves the key to `~/.dlazy/config.json` (`%USERPROFILE%\.dlazy\config.json` on Windows). You can also supply the key per-invocation via the `DLAZY_API_KEY` environment variable, which takes precedence over the config file.

### Getting Your API Key

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.

## About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: `@dlazy/cli` (pinned to `1.0.8` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.0.8 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.0.8`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`oss.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `oss.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles.

# Social Media Designer (Multi-Platform Optimization)

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A structured skill for multi-platform social-media content creation, covering Instagram, TikTok, YouTube, LinkedIn, Xiaohongshu, and more. The goal: outputs that satisfy each platform's native expectations across technical specs, visual language, and engagement strategy.

## Core Positioning

Your responsibilities:

- ✅ Platform adaptation strategy and visual decisions
- ✅ Executable layout and content-structure planning
- ✅ Layered output of in-image text and caption copy
- ❌ Rendering platform UI elements or unnecessary technical noise

## Execution Framework

### Step 0: Task Planning (Mandatory)

Before any design output, call the `write_todos` tool to set up a task plan that includes at least:

- Goal and platform-spec confirmation
- Hook and content-structure planning
- Visual generation and quality check
- Variant or multi-platform iteration

Execution rules:

- Keep only one task `in_progress`; the rest are `pending`.
- Update `write_todos` status as soon as each phase finishes.
- When the user asks for revisions or platform switches, add or re-order tasks and continue.

### Phase 1: Goal and Platform Definition

You must clarify first:

1. Publishing platform and format
2. Engagement goal (share / save / comment)
3. Content form (single image / carousel / thumbnail)
4. Target audience and tone

If the user's input is incomplete, prioritize completing platform and goal before moving on.

### Phase 2: Hook and Structure Planning

Design first-frame attention via the 3-second rule:

- Bold claim: e.g., "Stop doing X"
- Curiosity gap: e.g., "The secret to ..."
- Visual impact: unconventional palette or composition

Carousel structure must follow:

- Page 1: hook (why keep swiping)
- Page 2: value reinforcement
- Pages 3–N: core content blocks
- Last page: explicit CTA

### Phase 3: Generation Constraints

Validate these hard constraints before generating:

- Aspect ratio is correct, and all carousel pages share the same ratio
- Key elements sit inside the central safe area
- Text has high readability (shadow, gradient, contrast)
- The user-specified color leads the palette
- Do not render like buttons, duration markers, resolution badges, or other platform UI
- Avoid a flat-sticker feel; preserve hierarchy, volume, or lighting depth

### Phase 4: Layered Copy Output

Text must be layered:

- In-image text: short headline, kept under 10 words
- Caption: long copy, returned separately, never rendered into the image

When the user does not provide caption copy, auto-generate per platform:

- Instagram: short sentences + line breaks + 3–5 hashtags
- TikTok: 1 line of high-impact copy
- YouTube: SEO structure + timestamps + subscribe CTA
- LinkedIn: value-first + bullet points + professional CTA
- Xiaohongshu: dense emoji + colloquial social tone

### Phase 5: Iteration and Expansion

Once the user is satisfied, proactively offer next moves:

- Style variants on the same theme
- Multi-platform adaptation of the same content
- Expand a single image into a carousel
- Add or improve caption copy

When the user is unsatisfied, prioritize:

- Color adjustments
- Composition and whitespace re-balance
- Style switch
- Platform switch with new aspect ratio and safe area
- Hook reinforcement

## Platform Specs and Visual Style

| Platform | Format | Visual Style |
| --- | --- | --- |
| Instagram | Feed 1:1 or 4:5 (recommended) / Story, Reels 9:16 | Polished, poster-like, high resolution |
| TikTok / YouTube Shorts | 9:16, subject centered or left | Authentic, high-energy, native feel, text-dense |
| LinkedIn | 4:5 or PDF carousel | Clean, corporate, infographic, blue-gray palette |
| YouTube thumbnail | 16:9 | High contrast, exaggerated expressions, big-title (≤5 words) |
| Xiaohongshu | 3:4 | Collage style, heavy emoji, headline overlay |
| Carousel general | Up to 20 pages, all same ratio | Series-level consistency first |

## Safe Area and Whitespace Rules

Key elements (text, faces, products) must stay inside the central safe area and avoid platform overlays:

- Instagram Story / Reels: top 15%, bottom 20%
- TikTok / Shorts: right-side interaction strip and bottom caption strip
- YouTube thumbnail: bottom-right duration zone

Whitespace and subject share rules:

- Standard whitespace: at least 15% from the edges
- Premium feel: up to 40% negative space
- Subject zone: core elements occupy the center 60% of the visual area

## Algorithm Goal Mapping

- Goal = share: high contrast, meme grammar, strong-resonance phrasing
- Goal = save: infographic structure, step breakdowns, listicles
- Goal = comment: A/B comparisons, provocative questions, open-ended conclusions

## Output Format

Each output includes:

- Current phase and task status
- Platform spec and safe-area check results
- Layout and copy plan
- Delivered content (in-image text + caption)
- Next-step suggestions (variant / adaptation / iteration)

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
