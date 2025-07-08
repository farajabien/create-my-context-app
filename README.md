[![Powered by _my_context Platform](https://mycontext.fbien.com/favicon.ico) **Powered by _my_context Platform**](https://mycontext.fbien.com)

> **Note:** This repository is **public** and intended for open-source use. Contributions and community feedback are welcome!

# create-my-context-app

## 🚀 Instantly Scaffold a Production-Ready, Context-Driven Next.js App

**create-my-context-app** is a modern CLI that bootstraps a Next.js project with best-practice architecture, rich context files, and a beautiful UI foundation (shadcn/ui, Tailwind CSS). It's designed for AI-powered, context-first workflows—so you can go from idea to production in minutes.

---

## 🏁 Quick Start

```sh
npx create-my-context-app --name my-app --type full --generate --description "A SaaS for AI-driven project management."
```

Or, run interactively:

```sh
npx create-my-context-app
```

---

## ✨ Features

- **Context-Driven**: Generates or imports PRD, user stories, specs, and AI prompts into `_my_context/`.
- **Modern UI**: Sets up shadcn/ui, Tailwind CSS, and a responsive, accessible design system.
- **Flexible Context Setup**: Generate from description, import from email/project, or use a template.
- **Robust CLI**: Interactive and non-interactive modes, with email verification and project selection.
- **Best Practices**: SSR-first, RSC, modular TypeScript, Zod validation, and secure defaults.
- **Seamless Online Review**: Instantly review and edit your context at [mycontext.fbien.com](https://mycontext.fbien.com).

---

## 🛠️ CLI Usage

### Flags Table

| Flag           | Description                                              | Default              |
|----------------|----------------------------------------------------------|----------------------|
| `--name`       | Project directory name                                   | `my-context-app`     |
| `--type`       | Project type: `full` or `landing`                        | `full`               |
| `--generate`   | Generate new context from a description (for anonymous flow) |                    |
| `--description`| Project description for context generation               |                      |
| `--source-id`  | Retrieve a previously generated anonymous context        |                      |
| `--email`      | Email to use for authenticated actions (e.g., import)    |                      |
| `--project`    | Project ID to fetch/import (requires `--email`)          |                      |
| `--code`       | Email verification code (for non-interactive use)        |                      |
| `--yes`        | Skip all interactive prompts                             | `false`              |

### Example Workflows

#### Generate New Context Anonymously
```sh
npx create-my-context-app --name my-idea --type full --generate --description "A platform for sharing creative prompts."
```
> **Note:** This will return a `sourceId`. Save it to retrieve your context later!

#### Retrieve Anonymous Context by Source ID
```sh
npx create-my-context-app --name my-retrieved-idea --source-id <your-source-id>
```

#### Import Existing Context (Authenticated)
```sh
npx create-my-context-app --name landing-demo --type landing --email user@example.com --project <project-id>
```

#### Interactive (Prompted) Flow
```sh
npx create-my-context-app
# CLI: How would you like to set up your project context?
# User: (choose Generate Anonymously, Retrieve with Source ID, or Import from Account)
# ...
```

### Import a Process from the Platform Library

> **New!** Import a context process (e.g., payment handler, webhook, etc.) directly into your project from the MyContext platform.

#### Usage
```sh
npx create-my-context-app --import-process <process-id> --output <file-path>
```

#### Arguments
| Flag                  | Description                                      |
|-----------------------|--------------------------------------------------|
| `--import-process`    | The ID of the process to import                  |
| `--output`            | The file path to write the imported code to      |

#### What It Does
- Fetches the process export from your API:  
  `GET /api/processes/<process-id>/export`
- Parses the returned markdown to extract code blocks and integration instructions.
- Writes the main code block(s) to the specified output file.
- Optionally, writes integration instructions as a comment or a separate `.md` file.
- Prints a summary and next steps in the terminal.

#### Example
```sh
npx create-my-context-app --import-process mpesa-callback --output ./lib/payments/mpesa.ts
```

#### Next Steps
- Review the generated code and instructions.
- Install any required dependencies.
- Follow integration/setup steps as described in the instructions file (if present).

---

## 🧩 Context Setup Modes

1.  **Generate Anonymously**: Describe your project and let the CLI generate all context files. You will receive a unique `sourceId` to access these files later. This is great for quick trials.
2.  **Retrieve by Source ID**: If you've already generated context anonymously, use the `sourceId` to download the files into a new project scaffold.
3.  **Import from Account (Authenticated)**: Fetch context files previously generated on [mycontext.fbien.com](https://mycontext.fbien.com) using your email and Project ID. This links the context to your dashboard.
4.  **Template Only**: Use the default template context files as a starting point.

---

## 🔑 Email Verification

When providing your email, you'll receive a verification code. Paste it into the CLI (or use `--code` for automation).

**Example:**
```sh
npx create-my-context-app --email user@example.com --generate --description "..."
# CLI: A verification code has been sent to user@example.com
# CLI: Please enter the code:
# User: 123456
# CLI: Verified! Continuing...
```

---

## 🌐 Reviewing Your Context

- **Online:** Click the dashboard link printed in your terminal (e.g., [https://mycontext.fbien.com/projects/<project-id>](https://mycontext.fbien.com/projects/<project-id>)) to view and edit your context files in the web UI.
- **Locally:** Open the `_my_context/` folder in your project to see all generated files in your code editor.

---

## 🖥️ UI & Styling

- **shadcn/ui**: Modern, accessible React components ([docs](https://ui.shadcn.com/docs/components))
- **Tailwind CSS**: Utility-first, responsive styling
- **SSR & RSC**: Server-first rendering for performance and SEO
- **Best Practices**: Modular TypeScript, Zod validation, error boundaries, and guard clauses

---

## ⚡ Under the Hood: How It Works

1. **Create Project Directory**
2. **Copy Template Files** (`full`/`landing`)
3. **Inject Context** (generate/import/template)
4. **Install Dependencies** (`pnpm install`)
5. **Initialize shadcn/ui** (`pnpm dlx shadcn@latest init`)
6. **Print Next Steps & Dashboard Link**

---

## 🛡️ Security & Best Practices

- **Input Validation**: All user input is validated (Zod, email format, etc.)
- **HTTPS**: All API calls use HTTPS
- **Rate Limiting**: API endpoints are rate-limited
- **Error Handling**: Guard clauses and clear error messages throughout
- **No Secrets in Context**: Never store passwords or secrets in context files

---

## 🧪 Testing

- **Unit Tests**: Components and CLI logic are tested with Jest and React Testing Library
- **How to Run Tests:**
  ```sh
  pnpm test
  ```
- **Troubleshooting:**
  - Missing template files? Ensure you're using the latest CLI version.
  - Email verification not working? Check your spam folder or try a different email.
  - Still stuck? [Open an issue](https://github.com/farajabien/create-my-context-app/issues)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes (with tests!)
4. Open a PR

---

## 📚 Links & References

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs/installation)
- [Project Dashboard](https://mycontext.fbien.com/projects)
- [CLI Issues & Support](https://github.com/farajabien/create-my-context-app/issues)

---

## 💡 Why Context-Driven Development?

This workflow lets you:
- **Plan, code, and iterate faster** with AI-generated context
- **Share and review** your project's context online (authenticated) or via `sourceId` (anonymous)
- **Start every project with a production-ready, best-practice foundation**

---

**Scaffold smarter. Build faster. Ship with context.**

---

## 📝 Changelog

### v1.1.0
- **Feature:** Add `--import-process` CLI command to import process code and integration instructions directly from the MyContext platform.
- **Testing:** Comprehensive unit tests for the import logic and CLI argument parsing.
- **Docs:** Updated CLI usage section with detailed instructions and examples for the new import feature.
- **Improvements:** Minor code and documentation refinements for maintainability and clarity.








