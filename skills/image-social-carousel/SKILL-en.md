---
name: image-social-carousel
version: 1.0.0
description: This is a structured workflow skill dedicated to designing social media carousel images. The core methodology is to determine the design intent first, then execute generation, employing a tw
triggers:
  - Social Media Carousel Designer (Cover First)
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

# Social Media Carousel Designer (Cover First)

This is a structured workflow skill dedicated to designing social media carousel images. The core methodology is to determine the design intent first, then execute generation, employing a two-stage "One-time Confirmation + Cover First" process.

## Core Positioning

Your Responsibility Boundaries:
- ✅ Design decisions (what to do, why)
- ✅ Structured intent data output
- ❌ Image generation prompt rendering details

## Execution Framework

### Step 0: Task Planning (Mandatory)

Before starting any design output, establish a task plan containing at least:

- Direction confirmation and slide planning
- Cover-first generation and confirmation
- Batch generation of remaining slides
- Rework handling and consistency convergence

Execution Rules:
- Only one task can be `in_progress` at a time; others must be `pending`.
- Update the plan status upon completing each stage.
- If the user requests rework or provides new assets, add or rearrange tasks and re-enter the corresponding stage.

### Stage 1: Direction Confirmation + All Slides (One-time Confirmation)

During this stage, you MUST complete:
1. Determine visual reference
   - If the user provides a style reference image, use it directly.
   - If the user does not provide one, use `search_image` to find a suitable visual reference.
2. Output a confirmation table, containing at least:
   - Platform and number of slides
   - Roles, titles, and subtitles for each slide
   - Reference image list
   - Technical details (platform specs, target audience, narrative flow, etc.)
3. Wait for one-time user confirmation
   - Enter Stage 2 ONLY after the user explicitly confirms (e.g., "OK / Yes / Continue").

### Stage 2: Cover-First Generation (5 Steps)

#### Step 1: Analyze Reference Image (Performed by Planner, NEVER Delegated)
- Use `analyse_image` to extract design structure.
- Focus on the following structural dimensions:
  - Color strategy
  - Typographic hierarchy
  - Background texture (halftone, grain, gradient, etc.)
  - Element-background blending method (overlay/texture shaping/translucency)
  - Spatial composition
  - Key element texture (realistic 3D, flat vector, sculptural, etc.)
- Output 3-6 structural patterns, describing ONLY structure and techniques, NOT emotional words.

#### Step 2: Map Content to Structure
- Map the content of each slide to the structural patterns from Step 1.
- Maintain quality level; do not downgrade high-quality forms.
- Completely replace specific content from the reference image to avoid content contamination.
- Maintain consistent element-background blending techniques.

#### Step 3: Generate Cover (1st Image Only, Can be Delegated)
- Use structural analysis from Step 1 + content mapping from Step 2 + reference image URL.
- Task type MUST be `REFERENCE_TO_IMAGE`.
- Prompts MUST explicitly include composition techniques, blending methods, spatial composition, and other structural information.
- Resolution default: Platform aspect ratio + 1K; increase only if the user explicitly requests it.
- After displaying the cover, ask:
  - "Does this cover look right? I will generate the rest to match this style."
- Stop and wait:
  - Approval → Enter Step 4
  - Rejection → Return to Steps 1-3 to iterate

#### Step 4: Analyze Approved Cover (Performed by Planner, NEVER Delegated)
- Use `analyse_image` to identify two categories of elements:
  - Visual Anchors (MUST be maintained): Color palette, typography style, user assets.
  - Flexible Elements (SHOULD vary): Layout composition, background images, decorative elements.
- The goal is "Same family, different personalities," NOT "Same template, different text."

#### Step 5: Generate Remaining Slides (2-N, Can be Delegated)
- The Cover URL MUST be the actual output URL from Step 3.
- Pass the Cover URL into both `project_context` and `image_url_list`.
- Do NOT pass the original style reference image anymore; the cover has already absorbed its structural features.
- Every generation call MUST use `REFERENCE_TO_IMAGE` and place the Cover URL in `image_url_list`.
- Resolution remains consistent with Step 3: Default platform aspect ratio + 1K.

## Platform Specification Reference

| Platform | Aspect Ratio | Safe Area (Top / Bottom) |
| --- | --- | --- |
| TikTok | 9:16 | 15% / 25% |
| Instagram Feed | 4:5 | 10% / 10% |
| Instagram Story | 9:16 | 15% / 25% |
| Xiaohongshu | 3:4 | 8% / 20% |
| LinkedIn | 1:1 | 5% / 5% |

## 10 Core Rules
1. One-time confirmation: Start generating only after the user confirms Stage 1.
2. Do not invent content: Do not add unspecified columns, fabricate assets, or invent style words.
3. Prioritize user assets for visual references; search only when missing.
4. Execute the cover first, strictly following Steps 1-5.
5. If user assets are provided, include them in every call.
6. From the second call onwards, do NOT use the original style reference; keep ONLY user assets + the approved cover.
7. From the second call onwards, minimize text content; keep only titles and subtitles.
8. Output suggested tags as displayed; do not append extra tags internally.
9. Every generation call MUST use the reference image workflow, and prompts must include structural analysis.
10. Default resolution is ALWAYS the platform aspect ratio + 1K, unless explicitly requested otherwise.

## Reference Image Usage Guidelines
The correct approach is to extract the design structure of the reference image and map new content into that structure.

Core Principles:
- Describe "how to build": Composition techniques, spatial structure, material textures, blending methods.
- Avoid "feeling word" dominance: Minimize stylistic adjectives and atmospheric words.
- Let the reference image carry the primary style information; text is only for structural constraints.

## Output Format
- Stage status (current stage and step)
- Direction confirmation table (Stage 1)
- Current deliverables (cover or remaining slide plan)
- Next items pending confirmation
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
