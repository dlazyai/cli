---
name: image-amazon-product-image-suite
version: 1.0.0
description: This is a professional product image generation skill designed specifically for the Amazon e-commerce platform. It ensures that the output complies with Amazon's image guidelines while optim
triggers:
  - Amazon Product Image Suite
  - Main and secondary image design for Amazon detail pages.
  - Creation of product infographics, lifestyle scenes, and detail images.
  - A+ Brand Content page module design.
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["npm","npx"]},"install":"npm install -g @dlazy/cli@1.0.5"},"openclaw":{"systemPrompt":"When you need to use this skill, please strictly follow the guidelines provided by this skill to plan and execute. You can call various generative models of the dlazy CLI (such as dlazy seedream-4.5, etc.) to complete the actual image rendering. Note: Using `&` or `&&` for command chaining or background execution is not allowed in Windows PowerShell, please execute commands separately and synchronously."}}
---

# Amazon Product Image Suite

This is a professional product image generation skill designed specifically for the Amazon e-commerce platform. It ensures that the output complies with Amazon's image guidelines while optimizing for click-through and conversion rates.

## Core Deliverables

This skill covers the complete visual system of an Amazon product page:

- Main Image (1 image): Pure white background product image, complying with Amazon's mandatory guidelines.
- Secondary Images (6 images): Infographics, multiple angles, lifestyle scenes, detail close-ups, etc.
- A+ Content (8 images): Brand story, selling points, usage instructions, and other modules.

## Applicable Scenarios

- Main and secondary image design for Amazon detail pages.
- Creation of product infographics, lifestyle scenes, and detail images.
- A+ Brand Content page module design.

## Step 0: Task Planning (Mandatory)

Before starting any output, establish a task plan containing at least:

- Confirm output scope and number of images.
- Generate and confirm the main image visual baseline.
- Generate secondary images and converge on style consistency.
- Generate A+ modules and complete the full suite delivery.

Execution Rules:
- Only one task can be `in_progress` at a time; others must be `pending` or `completed`.
- Update the plan status upon completing each stage.
- When the user requests rework, style changes, or new materials, add or rearrange tasks and return to the corresponding stage.

## Adaptive Execution Flow

Automatically select the delivery path based on user needs:

- Full Suite: Main Image (1) + Secondary (6) + A+ (8) = 12-17 images.
- Product Images Only: Main Image (1) + Secondary (6) = 7 images.
- A+ Content Only: A+ Modules = 8 images.
- Unclear Requirements: Generate the main image first, then suggest secondary and A+ plans.

Generation Sequence Principles:
1. Confirm image plan and quantity.
2. Generate the main image first (establish visual baseline).
3. Generate secondary images based on the main image (maintain consistency).
4. Generate A+ content (if needed).

## Image Specifications

### General Requirements
- Minimum size: 1000px × 1000px
- Standard ratio: 1:1 (Main and Secondary images)
- Mobile text: No smaller than 30pt

### Main Image Mandatory Guidelines
Must have:
- Pure white background: RGB(255,255,255)
- Product occupies at least 85% of the frame
- Realistic product photo texture
- Product fully centered, evenly lit

Prohibited:
- Text, logos, watermarks
- Decorative graphics, misleading accessories
- Mannequins for clothing

## Secondary Image Types & Purposes

| Type | Purpose | Design Key Points |
| --- | --- | --- |
| Infographic | Highlight selling points, feature comparison | 4-6 selling points, callout lines pointing to features, icons to enhance visuals |
| Multi-angle | Show product from different perspectives | Consistent lighting, clean background, usually 2 images |
| Detail Close-up | Show material and craftsmanship | Macro composition, emphasizing texture |
| Lifestyle | Show real-world usage scenarios | Target users, real environment, usually 2 images |
| Variant Display | Show color or style options | All variants uniformly arranged and scaled |
| What's in the Box | Show package contents | Accessories complete and clearly identifiable |
| Size Reference | Show real size | Use common objects for scale reference |

## A+ Page Module Structure (8 Modules)

1. Hero Banner (21:9): Brand image
2. Pain Points/Scenarios (3:2): Evoke empathy
3. Selling Points/Feature Matrix (3:2): Core advantages
4. Key Ingredients/Technology (3:2): Tech endorsement
5. Efficacy Data/Comparison (3:2): Data proof
6. How to Use (3:2): Operational guidance
7. Multi-variant/Family Photo (3:2): Product line display
8. Brand Endorsement/Qualifications (21:9): Build trust

A+ Design Key Points:
- Embedded text recommended > 30pt (readable after platform compression).
- Keep key information out of the outer 5% area (to handle mobile cropping).
- Maintain narrative continuity between modules, avoiding information jumps.

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
