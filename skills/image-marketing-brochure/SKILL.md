---
name: image-marketing-brochure
version: 1.0.0
description: A complete workflow skill for marketing brochure design, covering everything from requirements gathering, layout design, to mock-up delivery, using a layout-first plus mandatory confirmation gate mechanism to reduce rework risk.
triggers:
  - Marketing Brochure Designer (Layout-First)
  - Corporate brand brochures, product introduction booklets
  - Event flyers, service description folds
  - Investment brochures, enrollment guides, project portfolios
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

# Marketing Brochure Designer (Layout-First)

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A complete workflow skill for marketing brochure design, covering everything from requirements gathering, layout design, to mock-up delivery. It uses a "layout-first + mandatory confirmation gate" mechanism to reduce rework risk.

## Core Positioning

Applicable scenarios:

- Corporate brand brochures, product introduction booklets
- Event flyers, service description folds
- Investment brochures, enrollment guides, project portfolios

Core deliverables:

- Layout design: full unfolded artwork (interior view + exterior view)
- Folded mock-up: rendering that simulates the actual folded state
- Lifestyle mock-up: real-world usage shots (held in hand, environment, etc.)

## Step 0: Task Planning (Mandatory)

Before any output, call `write_todos` to set up a task plan that includes at least:

- Requirements alignment and fold-type confirmation
- Layout design generation and iteration
- Layout confirmation gate and mock-up output
- Lifestyle mock-up generation and final delivery

Execution rules:

- Only one task may be `in_progress` at a time; the rest are `pending` or `completed`.
- Update `write_todos` status as soon as each phase finishes.
- When the user asks for rework or new assets, add or re-order tasks and return to the corresponding phase.

## Adaptive Execution Flow

Drive the work forward dynamically based on the request type:

| Request Type | Execution Flow |
| --- | --- |
| Full brochure | Confirm fold type and content framework → produce layout → user confirms → export mock-ups |
| Single page | Generate the requested page first → suggest filling in the missing pages to form a complete piece |
| Vague request | Clarify the fold type first (tri-fold / bi-fold / Z-fold, etc.) → then proceed |
| Mock-up only | Check whether a confirmed layout already exists; if not, produce and confirm the layout first, then output the mock-ups |

Critical gate:

- Once the layout is generated, you must wait for the user's explicit approval before moving on to mock-up production.

## Brochure Types and Output Specs

### Tri-Fold (most common)

- Output: 6 panels (3 exterior + 3 interior)
- Use cases: product introduction, service overview, corporate promotion

### Bi-Fold

- Output: 4 panels
- Use cases: event programs, menus, brief introductions

### Z-Fold

- Output: 6 panels unfolded in sequence
- Use cases: step-by-step guides, timelines, process descriptions

### Gate-Fold

- Output: 4+ panels with a dramatic central reveal
- Use cases: premium launches, luxury brands

### Accordion Fold

- Output: 6–8 panels unfolded progressively
- Use cases: maps, extended timelines

### Saddle-Stitched Booklet

- Output: 8+ pages bound into a booklet
- Use cases: product catalogs, annual reports

## Tri-Fold Delivery Standard (default example)

The layout must include:

- Exterior view (folded state): back panel → cover → inner flap
- Interior view (unfolded state): inner left → inner middle → inner right

Recommended content distribution:

| Panel | Core Content |
| --- | --- |
| Cover | Logo, hero visual, headline |
| Inner flap | Brief introduction, suspense hook |
| Inner left | Company story, background info |
| Inner middle | Core value proposition, key advantages |
| Inner right | Product features, call to action |
| Back panel | Contact info, social links, copyright |

## Image Generation Specs

Default aspect ratio: 4:3

### Step 1: Layout Design (must be completed first)

1. Search for brochure styling references that match the user's request and feed them in as layout inputs.
2. Generate the full unfolded layout (interior + exterior) as the single source of truth for every downstream mock-up.
3. The interior-view prompt must include these structural keywords:
   - No background
   - No white border
   - Flat 2D
   - Edge-to-edge
   - No perspective shadow or margin
   - All three panels in a single image, filling the canvas

### Step 1.5: User Confirmation (mandatory gate)

- Show the layout and ask explicitly:
  - "Does this layout meet your requirements? I'll move on to mock-ups once you confirm."
- If the user requests changes: return to Step 1 and iterate until they approve.
- Only after explicit approval may you proceed to Step 2.

### Step 2: Folded Mock-Ups (requires Step 1 approval)

Based on the approved layout, output:

- Standing: Z-folded standing on a white surface, cover prominent
- Flat-laid: partially unfolded, top-down view
- Stacked: 2–3 brochures stacked at varied angles

### Step 3: Lifestyle Mock-Ups (based on Step 1)

Based on the approved layout, output:

- Held in hand: first-person POV, brochure open in hand
- Lifestyle: third-person POV, mid-close shot of someone reading
- Environment: placed on a reception desk, booth, or public space

Consistency requirements:

- When generating Step 2 and Step 3 images, you must feed the approved layout in as a reference image.
- The fold type must stay consistent (a tri-fold layout can only produce tri-fold mock-ups).

## Key Design Parameters

Color rules:

- Follow the 60-30-10 color rule
- Cover prefers the brand primary color
- The CTA uses the accent color

Mandatory information:

- The back panel must include the copyright notice and contact info
- Regulated industries should include compliance disclaimers

## User Alignment Question Templates

Before generating, prefer to align on:

- "Which fold type do you need? Tri-fold is the most common choice and fits most scenarios."
- "What's the brochure's main purpose? (Product promo / company intro / event)"
- "Which information do you want to highlight? I can plan content distribution per panel."
- "Do you have ready-made copy, or should I draft from a description?"
- "Any brand colors or reference designs? You can upload images so I understand your style preference."
- "Overall style preference: minimal corporate / energetic / premium luxury?"
- "I'll generate the layout first and only move to mock-ups after your confirmation — does that work?"

## Iterative Improvement Guidance

When the user is unsatisfied, lead with these questions to locate the change:

- "Which panel needs adjustment — cover / interior / back?"
- "Is it mainly the color palette, layout, or content expression?"
- "Can you describe the desired outcome or upload a reference image?"

## Execution Strategy Summary

- Plan before execute: lock in fold type and content framework first.
- Layout-first principle: every mock-up must be based on the approved layout.
- Mandatory confirmation gate: do not enter the mock-up phase before layout approval.
- Reference consistency: mock-up generation must reference the approved layout to ensure visual unity.

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
