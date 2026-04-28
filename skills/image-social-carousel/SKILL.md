---
name: image-social-carousel
version: 1.0.0
description: A structured workflow skill dedicated to social-media carousel design, using a single-confirmation plus cover-first two-phase flow that decides intent first then executes.
triggers:
  - Social Carousel Designer (Cover-First)
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

# Social Carousel Designer (Cover-First)

[English](./SKILL.md) · [中文](./SKILL-cn.md)

A structured workflow skill dedicated to social-media carousel design. The core method is "decide intent first, then execute," using a "single-confirmation + cover-first" two-phase flow.

## Core Positioning

Your responsibilities:

- ✅ Design decisions (what to do, why)
- ✅ Structured intent data output
- ❌ Image-generation prompt rendering details

## Execution Framework

### Step 0: Task Planning (Mandatory)

Before any design output, call the `write_todos` tool to set up a task plan that includes at least:

- Direction confirmation and slide planning
- Cover-first generation and confirmation
- Batch generation of remaining slides
- Rework handling and consistency convergence

Execution rules:

- Keep only one task `in_progress`; the rest are `pending`.
- Update `write_todos` status as soon as each phase finishes.
- If the user asks for rework or new assets, add or re-order tasks and re-enter the corresponding phase.

### Phase 1: Direction Confirmation + All Slides (single confirmation)

This phase must accomplish:

1. Establish visual references
   - When the user provides a style reference image, use it directly.
   - Otherwise, use `search_image` to find a suitable visual reference.
2. Output a confirmation table that includes at least:
   - Platform and slide count
   - Each slide's role, headline, subheadline
   - Reference-image list
   - Technical details (platform spec, target audience, narrative flow, etc.)
3. Wait for the user's single confirmation.
   - Only after the user explicitly says "ok / go / continue" may you enter Phase 2.

### Phase 2: Cover-First Generation (5 steps)

#### Step 1: Analyze Reference Image (planner executes — never delegate)

- Use `analyse_image` to extract design structure.
- Focus on these structural dimensions:
  - Color strategy
  - Typography hierarchy
  - Background materials (halftone, grain, gradient, etc.)
  - How elements blend with the background (overlay / texture-shaped / semi-transparent)
  - Spatial composition
  - Texture quality of key elements (photoreal 3D, flat vector, sculptural, etc.)
- Output 3–6 structural patterns. Describe structure and technique only — no mood words.

#### Step 2: Map Content to Structure

- Map each slide's content to the structural patterns from Step 1.
- Preserve quality tier — do not downgrade high-quality forms.
- Replace the reference image's specific content fully to avoid contamination.
- Keep element-background blending technique consistent.

#### Step 3: Generate the Cover (Slide 1 only — delegable)

- Use Step 1's structural analysis + Step 2's content mapping + the reference URL.
- Task type must be `REFERENCE_TO_IMAGE`.
- The prompt must explicitly include compositional technique, blending method, and spatial composition.
- Default resolution: platform aspect ratio + 1K; only escalate when the user explicitly asks for more.
- After showing the cover, ask:
  - "Does this cover look right? I'll generate the rest to match this style."
- Stop and wait:
  - Approval → proceed to Step 4
  - Rejection → return to Steps 1–3 and iterate

#### Step 4: Analyze the Approved Cover (planner executes — never delegate)

- Use `analyse_image` to identify two element classes:
  - Visual anchors (must keep): palette, typography style, user assets
  - Flexible elements (should vary): layout composition, background imagery, decorative elements
- The goal is "same family, different personalities," not "same template, swap text."

#### Step 5: Generate Remaining Slides (2–N — delegable)

- The cover URL must be the actual output URL from Step 3.
- Pass the cover URL into both `project_context` and `image_url_list`.
- Stop passing the original style reference — the cover has absorbed its structural traits.
- Every generation call uses `REFERENCE_TO_IMAGE`, with the cover URL in `image_url_list`.
- Resolution stays consistent with Step 3: default platform aspect ratio + 1K.

## Platform Spec Reference

| Platform | Aspect Ratio | Safe Area (top / bottom) |
| --- | --- | --- |
| TikTok | 9:16 | 15% / 25% |
| Instagram Feed | 4:5 | 10% / 10% |
| Instagram Story | 9:16 | 15% / 25% |
| Xiaohongshu | 3:4 | 8% / 20% |
| LinkedIn | 1:1 | 5% / 5% |

## 10 Core Rules

1. Single confirmation: after Phase 1 finishes, get one user confirmation before generating.
2. No fabrication: do not add ungiven columns, invent assets, or invent style words.
3. Visual references prefer user assets — only search when those are missing.
4. Cover-first execution: follow Steps 1–5 strictly.
5. If user assets are provided, include them in every call.
6. Starting from the second call, drop the original style reference; keep only user assets + the approved cover.
7. Minimize text content from the second call onward — keep only headline and subheadline.
8. Output suggested tags as displayed; do not append extra internal tags.
9. Every generation call uses the reference-image flow, with prompts that include the structural analysis.
10. Default resolution is always platform aspect ratio + 1K, unless the user explicitly requests higher.

## Reference-Image Usage Guidelines

The correct approach is to extract the reference image's design structure and map new content into that structure.

Core principles:

- Describe "how it's built": compositional technique, spatial structure, material quality, blending method.
- Avoid letting "feeling words" dominate: minimize style adjectives and mood words.
- Let the reference image carry the main style information; the text only enforces structural constraints.

## Output Format

- Phase status (current phase and step)
- Direction confirmation table (Phase 1)
- Current deliverable (cover or remaining-slides plan)
- Next item awaiting confirmation
- Current todo status (phase, completed, pending)

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
