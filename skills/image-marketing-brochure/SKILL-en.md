---
name: image-marketing-brochure
version: 1.0.0
description: This is a complete workflow skill for marketing brochure design, covering the entire process from requirement confirmation and flat design to rendering delivery. It uses a 'Flat Design First
triggers:
  - Marketing Brochure Designer (Flat Design First)
  - Corporate brand brochures, product introduction manuals.
  - Event promotion flyers, service explanation leaflets.
  - Investment brochures, admission guides, project portfolios.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

# Marketing Brochure Designer (Flat Design First)

This is a complete workflow skill for marketing brochure design, covering the entire process from requirement confirmation and flat design to rendering delivery. It uses a "Flat Design First + Mandatory Confirmation Gate" mechanism to reduce rework risks.

## Core Positioning

Applicable Scenarios:
- Corporate brand brochures, product introduction manuals.
- Event promotion flyers, service explanation leaflets.
- Investment brochures, admission guides, project portfolios.

Core Deliverables:
- Flat Design Draft: Fully unfolded layout (inner view + outer view).
- Folded Rendering: Display images simulating the actual folded state.
- Scenario Application Image: Real-world usage scenarios like hand-held or environmental displays.

## Step 0: Task Planning (Mandatory)

Before starting any output, establish a task plan containing at least:

- Requirement alignment and fold type confirmation.
- Flat design draft generation and iteration.
- Flat design confirmation gate and rendering output.
- Scenario image generation and final delivery.

Execution Rules:
- Only one task can be `in_progress` at a time; others must be `pending` or `completed`.
- Update the plan status upon completing each stage.
- When the user requests rework or new materials, add or rearrange tasks and return to the corresponding stage.

## Adaptive Execution Flow

Dynamically advance based on user request type:

| Request Type | Execution Flow |
| --- | --- |
| Full Brochure | Confirm fold type & framework → Generate flat design → User confirmation → Export renderings |
| Single Page | Generate specified page first → Suggest missing pages to form a complete product |
| Vague Request | Clarify fold type first (Tri-fold/Bi-fold/Z-fold, etc.) → Advance to design |
| Renderings Only | Check for confirmed flat draft; if none, generate flat draft and confirm first, then output renderings |

Critical Gate:
- After generating the flat design draft, you MUST wait for the user's explicit confirmation before proceeding to the rendering stage.

## Brochure Types & Output Specifications

### Tri-fold (Most Common)
- Output: 6 panels (3 outer + 3 inner)
- Use: Product intros, service overviews, corporate promos

### Bi-fold
- Output: 4 panels
- Use: Event plans, menus, brief intros

### Z-fold
- Output: 6 panels, unfolding sequentially
- Use: Step-by-step guides, timelines, process explanations

### Gate-fold
- Output: 4+ panels, dramatic center unfolding
- Use: High-end launches, luxury brands

### Accordion Fold
- Output: 6-8 panels, progressive unfolding
- Use: Maps, extended timelines

### Saddle-stitched Booklet
- Output: 8+ pages, bound as a booklet
- Use: Product catalogs, annual reports

## Tri-fold Delivery Standards (Default Example)

The flat design draft must include:
- Outer View (Folded State): Back panel → Cover → Inner flap
- Inner View (Unfolded State): Inner left → Inner center → Inner right

Recommended Content Distribution:

| Panel | Core Content |
| --- | --- |
| Cover | Logo, main visual, title |
| Inner Flap | Brief intro, suspense hook |
| Inner Left | Company story, background info |
| Inner Center | Core value proposition, key advantages |
| Inner Right | Product features, call to action (CTA) |
| Back Panel | Contact info, social links, copyright |

## Image Generation Guidelines

Default Aspect Ratio: 4:3

### Step 1: Flat Design (Must be completed first)
1. Search for brochure style images related to user needs to use as flat draft reference input.
2. Generate the complete flat unfolded layout (inner + outer) to serve as the sole design baseline for all subsequent renderings.
3. Inner view prompts must contain the following structural keywords:
   - No background
   - No white borders
   - Flat 2D
   - Edge-to-edge
   - No perspective shadows or margins
   - Three panels in one image filling the canvas

### Step 1.5: User Confirmation (Mandatory Gate)
- Display the flat design draft and explicitly ask:
  - "Does this flat design draft meet your requirements? Please confirm before I proceed with the renderings."
- If the user requests changes: Return to Step 1 and iterate until explicitly approved.
- Enter Step 2 ONLY after the user explicitly approves.

### Step 2: Folded Rendering (After Step 1 confirmation)
Output based on the confirmed flat design draft:
- Standing: Z-fold standing on a white surface, highlighting the cover.
- Flat-lay: Partially unfolded, top-down view.
- Stacked: 2-3 brochures stacked at different angles.

### Step 3: Scenario Application Image (Based on Step 1)
Output based on the confirmed flat design draft:
- Hand-held: First-person view, holding the open brochure.
- Lifestyle: Third-person view, medium-close shot of a person reading.
- Environmental: Placed on a reception desk, booth, or public space.

Consistency Requirements:
- When generating images for Steps 2 and 3, the confirmed flat design draft MUST be used as the reference image input.
- The fold type must match (e.g., a tri-fold flat design can only output tri-fold renderings).

## Key Design Parameters

Color Rules:
- Follow the 60-30-10 color rule.
- Cover prioritizes the brand's primary color.
- Call to action (CTA) uses the accent color.

Mandatory Information:
- The back panel must include copyright notices and contact info.
- Regulated industries must include compliance disclaimers.

## User Alignment Q&A Template

Before generating designs, prioritize aligning on the following:
- "Which fold type do you need? Tri-fold is the most common and fits most scenarios."
- "What is the main purpose of the brochure? (Product promo / Company intro / Event promo)"
- "What information do you want to highlight? I can help plan the content distribution across panels."
- "Do you have ready-made copy? Or need me to generate it based on your description?"
- "Do you have brand colors or reference designs? You can upload images to help me understand your style preferences."
- "Overall style preference: Minimalist business / Energetic & trendy / High-end luxury?"
- "I will generate the flat design draft first, and after your confirmation, I'll generate the folded renderings. Is that okay?"

## Iteration & Optimization Guidance

When the user is unsatisfied, prioritize these questions to guide modifications:
- "Which panel needs adjustment? Cover / Inner pages / Back?"
- "Is it mainly the color scheme, layout, or content expression that needs changing?"
- "Could you describe your ideal result or upload reference images?"

## Execution Strategy Summary
- Plan before executing: Lock down the fold type and content framework first.
- Flat Design First: All renderings MUST be based on the confirmed flat design draft.
- Mandatory Confirmation Gate: DO NOT enter the rendering stage without flat draft confirmation.
- Reference Image Consistency: Renderings must reference the confirmed flat draft to ensure visual unity.

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
