---
name: logo-branding-system
version: 1.0.0
description: Used to build a professional process from the core logo to a complete brand visual system, ensuring creative quality, execution consistency, and practical delivery.
triggers:
  - Logo & Branding Professional Design System
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

# Logo & Branding Professional Design System

Used to build a professional process from the core logo to a complete brand visual system, ensuring creative quality, execution consistency, and practical delivery.

## Core Principles

1. Step-by-Step Execution Strategy
   - Adopt a progressive process; do not output massive content all at once.
   - When a single plan exceeds 2 images, submit the execution plan first, wait for confirmation, then start generating.
   - Upstream assets MUST be confirmed before advancing to downstream applications.
2. Object Consistency
   - The same brand elements MUST remain strictly consistent across all applications.
   - When creating variants based on existing images, the goal is replication consistency, not reinterpretation.
3. User Assets First
   - User-provided reference images, logos, and materials have the highest priority.
   - Strictly distinguish visual style from text content; brand names MUST follow user specifications.

## Execution Framework

### Step 0: Task Planning (Mandatory)

Before starting any design output, establish a task plan containing at least:

- Collect requirements and boundaries
- Design core Logo concept
- Generate derivative applications and brand system
- Stage confirmation and iterative correction

Execution Rules:
- Only one task can be `in_progress` at a time; others must be `pending`.
- Update the plan status upon completing each stage.
- If the user requests rework or provides new assets, add or rearrange tasks and re-enter the corresponding stage.

### Step A: Collect Requirements

You MUST confirm the following information:
- Brand Name
- Industry or Product Category
- Design Component Scope (Logo only or including derivative applications)

Design Component Definitions:
- Logo: Core brand identity.
- Derivative Applications: Practical scenarios based on the brand identity.

### Step B: Establish Core Logo

New logo design follows:
- Single Focus: One central element, avoiding background or decorative interference.
- Symbolic Abstraction: Refined to the most easily recognizable form.
- Clear Silhouette: High-contrast silhouette, clear edges.
- Default 1K resolution.

Concept Output Rules:
- Default to providing 4 different design directions for open-ended requests.
- Present each concept individually; do NOT use collage grids.
- Attach a 100-200 word design rationale for each concept.
- You MUST wait for user confirmation before proceeding to the next step.

### Step C: Create Derivative Applications

Deliverable Directions:
1. Logo Variants
   - Structural variants: Lettermark, Wordmark, Pictorial mark, Combination mark.
   - Layout or orientation variants.
   - Color variants.
   - Size and usage variants.
2. Brand Patterns and Auxiliary Graphics
   - Generate independent, reusable graphic assets.
3. Physical Applications
   - Business cards and stationery.
   - Packaging and merchandise.
   - Environmental signage and wayfinding systems.
4. Social Media Assets
   - Generate final images ready for direct posting.
5. Brand Identity System
   - Brand Core (Story, Pillars, Tone of Voice).
   - Logo System.
   - Color System.
   - Typography System.
   - Visual Language.
   - Application Examples.

Application Design Principles:
- Place the logo delicately; avoid making it excessively large and centered.
- Deconstruct brand elements into patterns, icons, and color blocks.
- Use white space to unify the visual hierarchy.
- Emphasize material and textural experiences.

## Stage Confirmation & Rollback Rules

- Confirm at the end of each step before continuing to the next.
- When the user requests adjustments to intermediate results, roll back to the corresponding upstream step to correct it first, then synchronously update downstream assets.
- If the user provides new reference assets, immediately reset the consistency baseline and unify all subsequent outputs.

## Output Format

- Requirement summary
- Current stage deliverables
- Next step plan and items pending confirmation
- Current todo status (stage, completed items, pending confirmation items)

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
