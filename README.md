# Project Scaffolder Plan: `create-my-context-app`

## Objective

Enable developers to instantly bootstrap a production-ready, context-driven Next.js project—complete with all context files, best-practice architecture, and UI foundations—using a single terminal command:

```bash
npx create-my-context-app
```

---

## Problem Statement

- **Friction in Setup**: Developers waste time manually setting up project structure, context files, and best-practice configs.
- **Inconsistent Context**: Without automation, context files and architecture often drift from standards.
- **Onboarding Bottleneck**: New contributors face a steep learning curve without a standardized starting point.

---

## Solution Overview

- **Composable CLI**: A Node.js CLI tool that scaffolds a new project directory, runs `pnpm dlx shadcn@latest init`, and injects all required context files and structure.
- **Context-Driven**: Reads from a template `_my_context/` folder, ensuring every new project starts with the latest, most effective context files.
- **Extensible**: Supports flags for project type (full/landing), optional features (PWA, analytics), and future template expansion.

---

## Key Features

1. **Interactive CLI**: Prompts for project name, type, and options.
2. **Automated UI Setup**: Runs `pnpm dlx shadcn@latest init` for UI foundation.
3. **Context Injection**: Copies/generates all context files (`PRD.md`, `user-stories.md`, etc.) into the new project.
4. **Best-Practice Structure**: Sets up `app/`, `components/`, `lib/`, and other directories per technical specs.
5. **Dependency Installation**: Installs all required dependencies.
6. **Next Steps Guidance**: Prints clear instructions for starting development.

---

## Implementation Plan

### 1. CLI Tool Design

- **Language**: TypeScript (compiled to Node.js)
- **Dependencies**: `prompts`, `execa`, `fs-extra`, `chalk`
- **Entry Point**: `bin/index.js` (with shebang for npx compatibility)
- **NPM Publish**: `create-my-context-app` as the CLI name

### 2. Template Structure

- `templates/full/` and `templates/landing/` for different project types
- Each template includes:
  - `_my_context/` (all context files)
  - `app/`, `components/`, `lib/`, etc. (empty or with starter files)
  - Example `README.md`, `tailwind.config.ts`, etc.

### 3. CLI Flow

1. **Prompt for Project Name and Type**
2. **Create Project Directory**
3. **Run `pnpm dlx shadcn@latest init`** in the new directory
4. **Copy Template Files** based on project type
5. **Prompt: Do you want to fetch existing context generations by email?**
6. **If yes:**
   - Fetch all generations for the email
   - **If multiple projects are found:**
     - Prompt user to select which project to import (using the new `project` parameter)
     - Fetch and inject only the selected project's context files
7. **Install Dependencies** (`pnpm install`)
8. **Print Next Steps**

---

## Example CLI Pseudocode (with Project Selection)

```ts
import prompts from "prompts"
import { execSync } from "child_process"
import { copySync } from "fs-extra"
import path from "path"
import fetch from "node-fetch"

async function main() {
  // ...prompt for name, type, email...
  const generations = await fetchGenerations(email)
  const projects = getUniqueProjects(generations)
  let selectedProject = null
  if (projects.length > 1) {
    selectedProject = await promptProjectSelection(projects)
  }
  const filteredGenerations = selectedProject
    ? await fetchGenerations(email, selectedProject)
    : generations
  // ...inject filteredGenerations into _my_context/ ...
}
```

---

## Acceptance Criteria

- [ ] CLI runs with `npx create-my-context-app`
- [ ] Prompts for project name and type
- [ ] Runs shadcn/ui init and sets up Tailwind, config, etc.
- [ ] Copies all context files and starter structure
- [ ] Installs dependencies and prints next steps
- [ ] README and docs are included in the scaffold
- [ ] **Supports project selection when fetching context generations by email**
- [ ] **Works offline for default templates; only requires internet for optional context fetch**

---

## Future Enhancements

- **Flags for non-interactive mode**: e.g., `npx create-my-context-app my-app --type=full --pwa`
- **Custom context file prompts**: Allow user to input PRD, user stories, etc. at scaffold time
- **Template updates**: Pull latest context templates from a remote repo
- **Post-creation hooks**: Auto-open in VSCode, git init, etc.

---

## References

- See `technical-specs.md` for architecture and stack
- See `development-guidelines.md` for code standards
- See `prompts/project-starter.md` for initial project setup logic

---

## API Integration: Generations Fetch

### Overview

A new API route `/api/generations` enables users (or automated tools) to fetch all generated context files for their projects by validating with their email address. Now, you can also filter by project using the `project` query parameter.

### Endpoint
```
GET /api/generations?email=user@example.com
GET /api/generations?email=user@example.com&project=project123
```

### Query Parameters
- `email` (required): The user's email address.
- `project` (optional): Project ID to filter generations (e.g., `project123`).

### Response
```json
{
  "generations": [ ... ]
}
```

### Integration Use Cases
- Fetch all context files for a user, or only for a specific project.
- Use in scaffolder CLI to let users select which project context to import.

### Security
- This endpoint authenticates by email only. For production, add authentication and rate limiting.

---

## Next Steps

1. Scaffold the CLI repo (`create-my-context-app`)
2. Add templates for both project types
3. Implement CLI logic and test locally
4. Publish to npm and document in main platform README
5. **Update CLI to use the `project` parameter for precise context import**
6. **Reference this API doc in your scaffolder and onboarding documentation**

---

**This plan ensures every new project starts with the same context-driven, production-ready foundation that powers _my_context itself.**

---

## API Integration: Generations Fetch

### Overview

A new API route `/api/generations` enables users (or automated tools) to fetch all generated context files for their projects by validating with their email address. This is useful for:
- Automated onboarding (e.g., pulling context into a new scaffolded project)
- Developer self-service (downloading all their context files)
- Integrating with external tools or platforms

### Usage

**Endpoint:**
```
GET /api/generations?email=user@example.com
```

**Example Request:**
```bash
curl "https://mycontext.fbien.com/api/generations?email=user@example.com"
```

**Example Response:**
```json
{
  "generations": [
    {
      "id": "project123_PRD.md_2024-01-15T10:30:00.000Z",
      "content": "# Product Requirements Document\n\n## Executive Summary\n...",
      "documentType": "PRD.md",
      "files": "{\"PRD.md\":\"# Product Requirements Document\\n\\n## Executive Summary\\n...\"}",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    // ... more generations ...
  ]
}
```

**Error Responses:**
- Missing email: `{ "error": "Missing email parameter." }` (400)
- User not found: `{ "error": "User not found." }` (404)
- No generations: `{ "generations": [] }` (200)

### Integration Example (Node.js)
```js
const fetch = require('node-fetch');
async function getGenerations(email) {
  const response = await fetch(`https://mycontext.fbien.com/api/generations?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
```

### Security Notes
- This endpoint authenticates by email only. For production, add authentication (token/session) and rate limiting.
- Always use HTTPS in production.
- Validate email format before making requests.

### Scaffold CLI Usage
- The CLI can optionally fetch and inject the user's generations into a new project by calling this endpoint after scaffold.
- Future: Support for authenticated fetch and richer integration (e.g., select which generations to import). 