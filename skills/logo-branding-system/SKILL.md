---
name: logo-branding-system
version: 1.0.0
description: A professional pipeline for building everything from a core mark to a complete brand visual system, ensuring creative quality, execution consistency, and shippable delivery.
triggers:
  - Logo & Branding Professional Design System
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

# Logo & Branding Professional Design System

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A professional pipeline for building everything from a core mark to a complete brand visual system, ensuring creative quality, execution consistency, and shippable delivery.

## Core Principles

1. Stepwise execution
   - Use a progressive flow; never dump large outputs in one shot.
   - When a single plan exceeds 2 images, submit the execution plan and wait for confirmation before generating.
   - Upstream assets must be confirmed before downstream applications proceed.
2. Object consistency
   - The same brand element stays strictly consistent across all applications.
   - When deriving variants from an existing image, the goal is to replicate consistency, not to reinterpret.
3. User assets first
   - Reference images, logos, and assets provided by the user have the highest priority.
   - Strictly separate visual style from textual content; the brand name uses what the user specifies.

## Execution Framework

### Step 0: Task Planning (Mandatory)

Before any design output, call the `write_todos` tool to set up a task plan that includes at least:

- Gather requirements and boundaries
- Design the core logo concept
- Generate derivatives and the brand system
- Phase confirmation and iterative correction

Execution rules:

- Keep only one task `in_progress`; the rest are `pending`.
- Update `write_todos` status as soon as each phase finishes.
- If the user asks for rework or new assets, add or re-order tasks and re-enter the corresponding phase.

### Step A: Gather Requirements

You must confirm:

- Brand name
- Industry or product category
- Component scope (logo only, or with derivatives)

Component definitions:

- Logo: the core brand mark
- Derivatives: real-world applications based on the brand mark

### Step B: Establish the Core Mark

New mark design follows:

- Single focus: one central element, no background or decorative interference
- Symbolic abstraction: distill to the most recognizable form
- Clear silhouette: high-contrast outline, well-defined edges
- Default 1K resolution

Concept rules:

- For open-ended requests, default to 4 distinct design directions
- Present each concept individually, not as a tile grid
- Each concept comes with a 100–200 word design rationale
- Wait for user confirmation before proceeding

### Step C: Create Derivatives

Possible directions:

1. Mark variants
   - Structural variants: lettermark, wordmark, symbol mark, combination mark
   - Layout or orientation variants
   - Color variants
   - Size and use-case variants
2. Brand patterns and supporting graphics
   - Generate independent, reusable graphic assets
3. Physical applications
   - Business cards and stationery
   - Packaging and merchandise
   - Environmental signage and wayfinding
4. Social-media assets
   - Generate ready-to-post final images
5. Brand identity system
   - Brand core (story, pillars, voice)
   - Logo system
   - Color system
   - Typography system
   - Visual language
   - Application examples

Application design principles:

- Place the mark with restraint; avoid oversized, dead-center placements
- Deconstruct brand elements into patterns, icons, color blocks
- Use whitespace to organize visual hierarchy
- Emphasize material and texture experience

## Phase Confirmation and Rollback Rules

- Confirm at the end of every step before continuing.
- When the user adjusts an intermediate result, return to the corresponding upstream step first, then sync downstream assets.
- If the user supplies new reference assets, immediately reset the consistency baseline and unify subsequent outputs.

## Output Format

- Requirements summary
- Current-phase deliverable
- Next-step plan and items awaiting confirmation
- Current todo status (phase, completed, pending)

## Key Value

- Progressive workflow that lowers rework cost
- Multi-direction concept exploration that improves decision quality
- End-to-end consistency control that strengthens brand recognition
- Integrated delivery from logo to brand system

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
