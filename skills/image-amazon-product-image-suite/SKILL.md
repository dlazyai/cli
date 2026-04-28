---
name: image-amazon-product-image-suite
version: 1.0.0
description: A professional product image generation skill purpose-built for the Amazon e-commerce platform, with outputs that comply with Amazon's image guidelines while optimizing for click-through and conversion.
triggers:
  - Amazon Product Image Suite
  - Amazon detail-page main and secondary image design
  - Product infographics, lifestyle shots, and detail shots
  - A+ Brand Content page modules
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

# Amazon Product Image Suite

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A professional product image generation skill purpose-built for the Amazon e-commerce platform. Outputs comply with Amazon's image guidelines while optimizing for click-through and conversion.

## Core Deliverables

This skill covers the full visual system of an Amazon product detail page:

- Main image (1): pure-white background, complies with Amazon's mandatory rules
- Secondary images (6): infographics, multi-angle shots, lifestyle scenes, detail close-ups, etc.
- A+ page (8): brand story, selling-point showcase, usage instructions, and other modules

## Applicable Scenarios

- Amazon detail-page main and secondary image design
- Product infographics, lifestyle shots, and detail shots
- A+ Brand Content page modules

## Step 0: Task Planning (Mandatory)

Before any output, call `write_todos` to set up a task plan that includes at least:

- Confirm output scope and image count
- Generate and lock in the main-image visual baseline
- Generate secondary images and converge on style consistency
- Generate A+ modules and complete the full delivery

Execution rules:

- Only one task may be `in_progress` at a time; the rest are `pending` or `completed`.
- Update `write_todos` status as soon as each phase finishes.
- When the user requests rework, redesign, or new assets, add or re-order tasks and return to the corresponding phase.

## Adaptive Execution Flow

Pick the delivery path based on the user's request:

- Full suite: main (1) + secondary (6) + A+ (8) = 12–17 images
- Product images only: main (1) + secondary (6) = 7 images
- A+ page only: A+ modules = 8 images
- Unclear request: generate the main image first, then propose secondary and A+ plans

Generation order principles:

1. Confirm the image plan and count
2. Produce the main image first (establish the visual baseline)
3. Generate secondary images derived from the main image (preserve consistency)
4. Generate A+ content (if required)

## Image Specifications

### General Requirements

- Minimum size: 1000px × 1000px
- Standard ratio: 1:1 (main and secondary)
- Mobile text: at least 30pt

### Main Image Mandatory Rules

Must satisfy:

- Pure-white background: RGB(255, 255, 255)
- Product fills at least 85% of the frame
- Real-product photo quality
- Product fully centered with even lighting

Forbidden:

- Text, logos, or watermarks
- Decorative graphics or misleading accessories
- Mannequins for apparel

## Secondary Image Types

| Type | Purpose | Design Notes |
| --- | --- | --- |
| Infographic | Highlight selling points / feature comparison | 4–6 selling points, callout lines pointing to features, icons reinforce visuals |
| Multi-angle | Show the product from different angles | Consistent lighting, clean backgrounds, usually 2 shots |
| Detail close-up | Show materials and craftsmanship | Macro composition, emphasize texture |
| Lifestyle | Show real usage scenarios | Target user in a real environment, usually 2 shots |
| Variant showcase | Show color or style options | All variants arranged with consistent layout and scale |
| Package contents | Show what's in the box | All accessories complete and clearly identifiable |
| Size reference | Show real-world size | Use a familiar object as a scale reference |

## A+ Page Module Structure (8 modules)

1. Hero banner (21:9): brand presence
2. Pain point / scenario (3:2): build empathy
3. Selling-point / feature matrix (3:2): core advantages
4. Key ingredients / technology (3:2): technical credibility
5. Efficacy data / comparison (3:2): proof
6. How to use (3:2): operating guidance
7. Variants / family shot (3:2): product line
8. Brand endorsements / certifications (21:9): trust building

A+ design notes:

- Embedded text should be larger than 30pt (still legible after platform compression)
- Keep critical info out of the outer 5% margin (handles mobile cropping)
- Maintain narrative continuity across modules; avoid abrupt jumps

## Conversion Reference Strategy

- Lifestyle shots: typical lift around +18%
- Infographics: typical lift around +8%
- Detail close-ups: typical lift around +6%
- 7 images vs. 4 images: typical lift around +32%
- Optimized image mix: engagement lift up to +30%

These figures are priority hints, not guarantees.

## Multi-Image Consistency Rules

- Main first: always produce the main image before everything else
- Reference the main: derive secondary images and A+ from the main image as the visual anchor
- Appearance consistency: keep colors, materials, and structural details aligned
- Style consistency: unify background language, palette, fonts, and icon style

## Execution Plan

When the skill is invoked, drive the work forward in this order:

1. Confirm output scope: full suite / product images only / A+ only
2. Collect product info: photo or description, core selling points, target audience
3. Generate the main image: lock in the visual and material baseline
4. Generate secondary images one by one: pick image types based on goals and deliver each
5. Generate the A+ page: build a brand narrative across the 8 modules
6. Iterate: adjust composition, copy hierarchy, and information density based on feedback

## Output Format

- Current phase and target deliverable
- Image checklist (done / pending)
- Main-image consistency check verdict
- Next item awaiting confirmation
- Current todo status (phase, completed items, pending items)

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
