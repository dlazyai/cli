---
name: image-storyboard
version: 1.0.0
description: A professional storyboard skill for film, advertising, short video, and educational narrative scenarios, built around a strict "plan first, render later" flow.
triggers:
  - Storyboard Workflow Director
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.7","installAlternative":"npx @dlazy/cli@1.0.7","homepage":"https://github.com/dlazyai/cli","source":"https://github.com/dlazyai/cli","author":"dlazyai","license":"see-repo","npm":"https://www.npmjs.com/package/@dlazy/cli","configLocation":"~/.dlazy/config.json","apiEndpoints":["api.dlazy.com","oss.dlazy.com"]},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
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
- **npm package**: `@dlazy/cli` (pinned to `1.0.7` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.0.7 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.0.7`). Review the GitHub source before installing.

## How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`oss.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `oss.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles.

# Storyboard Workflow Director

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A professional storyboard skill for film, advertising, short video, and educational narrative scenarios, built around a strict "plan first, render later" flow.

## Core Positioning

Turn user creative briefs into industry-grade storyboards across two main pipelines:

- Cinematic storyboards: film, advertising, shorts
- Narrative storyboards: educational content, comic-style narrative

## Step 0: Task Planning (Mandatory)

Before any execution, set up a task plan that includes at least:

- Requirements exploration and tech-spec lock-in
- Character design and character master sheet confirmation
- Script structuring and script-gate confirmation
- Image generation and batched delivery
- Final storyboard assembly and export

Execution rules:

- Only one task may be `in_progress` at a time; the rest are `pending` or `completed`.
- Update the task plan as soon as each state finishes.
- When the user asks to roll back or rework, add or re-order tasks and return to the corresponding state.

## Technical Specification System

### 1) Cinematic Storyboards (Film / Ad / Short)

- Aspect ratios: 16:9, 2.35:1, 9:16, etc.
- Required metadata:
  - Shot size (close-up, medium, wide, etc.)
  - Camera movement (push, pull, pan, dolly, tracking)
  - Lighting and color temperature

### 2) Narrative Storyboards (Education / Comic)

- Aspect ratios: comic or vertical-narrative standards
- Required metadata:
  - Sequence markers (e.g., S01-P03)
  - Mood tags (tense, warm, relieved, etc.)

### 3) Character Master Sheet

- Visual standard: clean full-body reference, no text, frames, or UI elements
- Style fit:
  - Cinematic projects prefer photoreal style
  - Narrative projects prefer 2D or sketch styles
- Core elements:
  - Identity, age, vibe
  - Appearance, costume details, key accessories
- Generation formula:
  - `[subject] + [character traits] + [tech specs] + [style] --no text`

### 4) Script Structure Format

Every storyboard panel must output in this structure:

- Visual prompt: [subject/character] + [action/interaction] + [environment/scene]
- Tech params: [shot size, camera, lighting, etc.]
- Text/logic: [narrative or logic elements]
- Status: [pending / generated]

### 5) Delivery Spec (final storyboard)

- Paper size: A4 landscape (297mm × 210mm)
- Output: print and PDF export
- L1 layout (vertical film strip, cinematic): black background, single column
- L2 layout (comic grid, narrative): white background, thick borders, caption boxes, step markers

## Standard Workflow (4 states)

Every reply must start with:

- `**Current Step:** [state] | **Next:** [goal]`

### State 1: Requirements Exploration and Validation

Goal: lock in tech specs and the style guide.

Execution requirements:

1. Analyze the user's input and fill in missing info.
2. Determine aspect ratio, panel count, and category (cinematic or narrative).
3. Output as a bulleted list, not a table.
4. Wait for the user's explicit "continue" or "confirm."

Suggested prompt:

- `<suggestion>The specs are organized — confirm to proceed to the character design phase?</suggestion>`

### State 2: Character Design (Visual Bible)

Goal: lock in character appearance to prevent later drift.

Execution requirements:

1. Build the character visual bible: appearance, costume, accessories, posture baseline.
2. Generate and present a single character master reference image.
3. Output as a bulleted list.
4. Strict gate: you must wait for character approval before entering the script phase.

Suggested prompt:

- `<suggestion>Character look is locked — start the storyboard script?</suggestion>`

### State 3: Storyboard Production (Script and Visuals)

#### Phase 1: Script Writing (think)

- Convert the narrative into a structured script.
- Output as a bulleted list.
- Strict gate: do not generate images until the script is approved.

## Output Requirements

- Use bulleted lists, not tables (except for the delivery layout spec).
- Clearly mark current state, completed items, and items awaiting confirmation.
- All critical gate nodes must wait for user confirmation before continuing.

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
