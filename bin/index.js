#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk")); // For colorful output
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fsPromises = require("fs/promises");
const fetch = require("node-fetch");
/**
 * Simple CLI flag parsing (no minimist dependency)
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--")) {
            const key = args[i].replace(/^--/, "");
            const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
            result[key] = value;
            if (value !== true)
                i++;
        }
    }
    return result;
}
/**
 * Imports a process export from the API, extracts code and instructions, and writes to output files.
 * @param {string} processId - The process ID to import
 * @param {string} outputPath - The file path to write the code to
 */
async function importProcess(processId, outputPath) {
  const apiUrl = `http://localhost:3000/api/processes/${processId}/export`;
  let res;
  try {
    res = await fetch(apiUrl);
  } catch (err) {
    console.error(chalk_1.default.red(`Network error: ${err.message}`));
    process.exit(1);
  }
  if (!res.ok) {
    console.error(chalk_1.default.red(`Failed to fetch process: ${res.status} ${res.statusText}`));
    process.exit(1);
  }
  const markdown = await res.text();

  // Extract the first TypeScript code block
  const codeMatch = markdown.match(/```(?:typescript|ts)\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1] : null;
  if (!code) {
    console.error(chalk_1.default.red('No TypeScript code block found in process export.'));
    process.exit(1);
  }
  await fsPromises.writeFile(outputPath, code, 'utf8');

  // Optionally, extract integration instructions
  const instructionsMatch = markdown.match(/## Integration Instructions\n([\s\S]*)/);
  if (instructionsMatch) {
    const instructions = instructionsMatch[1].trim();
    await fsPromises.writeFile(outputPath + '.md', instructions, 'utf8');
  }

  console.log(chalk_1.default.green(`✔ Process code written to: ${outputPath}`));
  if (instructionsMatch) {
    console.log(chalk_1.default.green(`✔ Integration instructions written to: ${outputPath}.md`));
  }
  console.log(chalk_1.default.white('Next steps:'));
  console.log(chalk_1.default.cyan('- Review the code and instructions.'));
  console.log(chalk_1.default.cyan('- Install any required dependencies.'));
  if (instructionsMatch) {
    console.log(chalk_1.default.cyan('- Follow integration/setup steps as described.'));
  }
}
/**
 * Main CLI function that handles the scaffolding process
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const cliArgs = parseArgs();
        // --- Import Process Command ---
        if (cliArgs["import-process"] && cliArgs["output"]) {
            // Wrap in IIFE to allow await in non-async context
            (async () => {
                await importProcess(cliArgs["import-process"], cliArgs["output"]);
                process.exit(0);
            })();
            return;
        }
        const isNonInteractive = !!cliArgs.email && !!cliArgs.project;
        let projectName = "";
        let projectType = "";
        let fetchGenerations = false;
        let email = cliArgs.email;
        let projectId = cliArgs.project;
        let generateNewContext = false;
        let contextDescription = "";
        let code = cliArgs.code;
        let verified = false;
        if (isNonInteractive) {
            // Use defaults or CLI flags for projectName and projectType
            projectName =
                typeof cliArgs.name === "string" ? cliArgs.name : "my-context-app";
            projectType = typeof cliArgs.type === "string" ? cliArgs.type : "full";
            fetchGenerations = !!cliArgs.project || !!cliArgs.email;
            generateNewContext = !!cliArgs.generate;
            contextDescription =
                typeof cliArgs.description === "string" ? cliArgs.description : "";
        }
        else {
            // Interactive mode
            console.log(chalk_1.default.blue("✨ Welcome to the MyContext App Scaffolder! ✨"));
            // 1. Prompt for project name and type
            const questions = [
                {
                    type: "text",
                    name: "name",
                    message: "What is your project name?",
                    validate: (value) => value.length > 0 ? true : "Please enter a project name.",
                },
                {
                    type: "select",
                    name: "type",
                    message: "What type of project do you want to create?",
                    choices: [
                        { title: "Full App (with full Next.js structure)", value: "full" },
                        {
                            title: "Landing Page (optimized for simple landing pages)",
                            value: "landing",
                        },
                    ],
                    initial: 0,
                },
                {
                    type: "select",
                    name: "contextSource",
                    message: "How would you like to set up your project context?",
                    choices: [
                        { title: "Generate new context from description", value: "generate" },
                        { title: "Import existing context from email", value: "import" },
                        { title: "Start with basic template only", value: "template" },
                    ],
                    initial: 0,
                },
                {
                    type: (prev) => (prev === "generate" ? "text" : null),
                    name: "contextDescription",
                    message: "Describe your project idea (the more detail, the better):",
                    validate: (value) => value.length > 10
                        ? true
                        : "Please provide a more detailed description (at least 10 characters).",
                },
                {
                    type: (prev, values) => values.contextSource === "import" ? "text" : null,
                    name: "email",
                    message: "Please enter your email to fetch existing context:",
                    validate: (value) => /^\S+@\S+\.\S+$/.test(value)
                        ? true
                        : "Please enter a valid email address.",
                },
                {
                    type: (prev, values) => values.contextSource === "import" && !cliArgs.project ? "text" : null,
                    name: "projectId",
                    message: "Paste your Project ID (or leave blank to select interactively):",
                    validate: (value) => value.length === 0 || /^[a-zA-Z0-9_-]+$/.test(value)
                        ? true
                        : "Invalid Project ID format.",
                },
            ];
            const response = yield (0, prompts_1.default)(questions);
            projectName = response.name;
            projectType = response.type;
            if (response.contextSource === "generate") {
                generateNewContext = true;
                contextDescription = response.contextDescription;
                email = cliArgs.email; // Use CLI email if provided for generation tracking
            }
            else if (response.contextSource === "import") {
                fetchGenerations = true;
                email = response.email;
                projectId = response.projectId || undefined;
            }
        }
        if (!projectName || !projectType) {
            console.log(chalk_1.default.red("Exiting: Project name and type are required."));
            process.exit(1);
        }
        // Check if project directory already exists
        const projectPath = path_1.default.join(process.cwd(), projectName);
        if (fs_1.default.existsSync(projectPath)) {
            console.log(chalk_1.default.red(`Error: Directory '${projectName}' already exists. Please choose a different project name.`));
            process.exit(1);
        }
        const templatePath = path_1.default.join(__dirname, "../templates", projectType);
        const contextPath = path_1.default.join(projectPath, "_my_context");
        console.log(chalk_1.default.cyan(`\n🚀 Creating your project: ${projectName} (${projectType} type)...`));
        try {
            // 2. Create Project Directory
            console.log(chalk_1.default.gray(`- Creating project directory: ${projectName}`));
            fs_1.default.mkdirSync(projectName, { recursive: true });
            process.chdir(projectName);
            // 3. Copy Template Files based on project type
            console.log(chalk_1.default.gray(`- Copying ${projectType} template files...`));
            (0, fs_extra_1.copySync)(templatePath, process.cwd(), { overwrite: true });
            // Ensure _my_context directory exists
            fs_1.default.mkdirSync(contextPath, { recursive: true });
            (0, fs_extra_1.emptyDirSync)(contextPath); // Clear existing template context files if any
            // 4. Inject context (generate/import/template) - already handled above
            // ... context injection logic ...
            // 5. Install Dependencies (`pnpm install`)
            console.log(chalk_1.default.gray("- Installing dependencies... (This may take a moment)"));
            (0, child_process_1.execSync)("pnpm install", { stdio: "inherit" });
            // 6. Run shadcn/ui initialization
            console.log(chalk_1.default.gray("- Initializing shadcn/ui... (This may take a moment)"));
            (0, child_process_1.execSync)("pnpm dlx shadcn@latest init", { stdio: "inherit" });
            // 7. Print Next Steps
            console.log(chalk_1.default.green(`\n🎉 Project ${projectName} created successfully! 🎉`));
            console.log(chalk_1.default.white("\nNext steps:"));
            console.log(chalk_1.default.cyan(`  cd ${projectName}`));
            console.log(chalk_1.default.cyan("  pnpm dev"));
            console.log(chalk_1.default.white("\nHappy coding! 🚀"));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\nAn error occurred during scaffolding: ${error.message}`));
            // Clean up created directory if an error occurred during setup
            const currentDir = process.cwd();
            const expectedPath = path_1.default.join(path_1.default.dirname(currentDir), projectName);
            if (currentDir === expectedPath || currentDir.endsWith(projectName)) {
                process.chdir(".."); // Move out of the newly created directory
                console.log(chalk_1.default.yellow(`Attempting to clean up partially created directory: ${projectName}`));
                try {
                    fs_1.default.rmSync(projectName, { recursive: true, force: true });
                    console.log(chalk_1.default.yellow(`Cleaned up ${projectName}.`));
                }
                catch (cleanupError) {
                    console.error(chalk_1.default.red(`Error during cleanup: ${cleanupError.message}`));
                }
            }
            process.exit(1);
        }
    });
}
/**
 * Extracts unique project IDs from a list of generations by parsing the id field.
 * Assumes id format: <projectId>_<documentType>_<timestamp>
 */
function extractProjectIds(generations) {
    const projectIds = new Set();
    generations.forEach((gen) => {
        const match = gen.id.match(/^([^_]+)_/);
        if (match && match[1]) {
            projectIds.add(match[1]);
        }
    });
    return Array.from(projectIds);
}
/**
 * Fetches context generations for a given email (and optional project) from the mycontext.fbien.com API.
 * @param email - The user's email address.
 * @param project - Optional project ID to filter generations.
 * @returns Promise resolving to an array of Generation objects.
 */
function getGenerations(email, project) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://mycontext.fbien.com/api/generations?email=${encodeURIComponent(email)}`;
        if (project) {
            url += `&project=${encodeURIComponent(project)}`;
        }
        const headers = { "Content-Type": "application/json" };
        try {
            const response = yield (0, node_fetch_1.default)(url, { headers });
            const data = yield response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data.generations;
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to fetch generations: ${error}`));
            throw error;
        }
    });
}
/**
 * Generates new context from a project description using the MyContext API.
 * @param description - The project description/idea provided by the user.
 * @param projectType - The type of project ("full" or "landing").
 * @param email - Optional email for tracking and authentication.
 * @returns Promise resolving to a Record of file names to content.
 */
function generateContextFromDescription(description, projectType, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://mycontext.fbien.com/api/generate-context";
        const headers = { "Content-Type": "application/json" };
        const body = {
            description,
            projectType,
            email: email || undefined,
        };
        try {
            const response = yield (0, node_fetch_1.default)(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });
            const data = yield response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data.files || {};
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to generate context: ${error}`));
            throw error;
        }
    });
}
/**
 * Sends a verification code to the user's email via the MyContext API.
 * @param email - The user's email address.
 * @returns Promise resolving to true if sent, throws on error.
 */
function sendVerificationCode(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://mycontext.fbien.com/api/send-verification-code";
        const headers = { "Content-Type": "application/json" };
        try {
            const response = yield (0, node_fetch_1.default)(url, {
                method: "POST",
                headers,
                body: JSON.stringify({ email }),
            });
            const data = yield response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return true;
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to send verification code: ${error}`));
            throw error;
        }
    });
}
/**
 * Verifies the code sent to the user's email via the MyContext API.
 * @param email - The user's email address.
 * @param code - The verification code entered by the user.
 * @returns Promise resolving to true if verified, false otherwise.
 */
function verifyCode(email, code) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "https://mycontext.fbien.com/api/verify-code";
        const headers = { "Content-Type": "application/json" };
        try {
            const response = yield (0, node_fetch_1.default)(url, {
                method: "POST",
                headers,
                body: JSON.stringify({ email, code }),
            });
            const data = yield response.json();
            if (!response.ok) {
                return false;
            }
            return data.verified === true;
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to verify code: ${error}`));
            return false;
        }
    });
}
(async () => {
  await main();
})();
