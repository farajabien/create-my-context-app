import prompts, { PromptObject } from "prompts";
import { execSync } from "child_process";
import { copySync, emptyDirSync } from "fs-extra";
import path from "path";
import chalk from "chalk"; // For colorful output
import fs from "fs";
import fetch from "node-fetch";

/**
 * Generation object interface for type safety
 */
interface Generation {
  id: string;
  content: string;
  documentType: string;
  files?: string;
  createdAt?: string;
  sourceId?: string; // For anonymous generations
}

/**
 * Simple CLI flag parsing (no minimist dependency)
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const value =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
      result[key] = value;
      if (value !== true) i++;
    }
  }
  return result;
}

// Export for testing
export { parseArgs };

/**
 * Main CLI function that handles the scaffolding process
 */
async function main() {
  console.log('[DEBUG] CLI main() started');
  const cliArgs = parseArgs();
  const isNonInteractive = !!cliArgs.yes || (!!cliArgs.email && !!cliArgs.project) || !!cliArgs['source-id'] || (!!cliArgs.generate && !!cliArgs.description && !cliArgs.email);

  let projectName = "";
  let projectType = "";
  let fetchGenerations = false;
  let email = cliArgs.email as string | undefined;
  let projectId = cliArgs.project as string | undefined;
  let sourceId = cliArgs['source-id'] as string | undefined;
  let generateNewContext = false;
  let contextDescription = "";
  let code = cliArgs.code as string | undefined;
  let verified = false;
  let contextMode: 'generate_anon' | 'retrieve_source' | 'import_auth' | 'template' = 'template';

  if (isNonInteractive) {
    // Non-interactive flows
    projectName = typeof cliArgs.name === "string" ? cliArgs.name : "my-context-app";
    projectType = typeof cliArgs.type === "string" ? cliArgs.type : "full";
    sourceId = typeof cliArgs['source-id'] === 'string' ? cliArgs['source-id'] : undefined;
    
    if (sourceId) {
      contextMode = 'retrieve_source';
      // Flow: Retrieve by sourceId (highest priority)
      // This will be handled later in the logic
    } else if (cliArgs.email) {
      contextMode = 'import_auth';
      fetchGenerations = true;
      projectId = typeof cliArgs.project === 'string' ? cliArgs.project : undefined;
    } else if (cliArgs.generate && cliArgs.description) {
      contextMode = 'generate_anon';
      generateNewContext = true;
      contextDescription = typeof cliArgs.description === 'string' ? cliArgs.description : '';
    } else {
      // No context flags provided: default to template mode
      contextMode = 'template';
    }

  } else {
    // Interactive mode
    console.log(chalk.blue("✨ Welcome to the MyContext App Scaffolder! ✨"));
    // 1. Prompt for project name and type
    const questions: PromptObject<any>[] = [];
    if (!cliArgs.name) {
      questions.push({
        type: "text",
        name: "name",
        message: "What is your project name?",
        validate: (value: string) => {
          if (value.length === 0) {
            return "Please enter a project name.";
          }
          // Check for invalid directory names
          if (value === "." || value === ".." || value.includes("/") || value.includes("\\")) {
            return "Please enter a valid project name (cannot be '.' or '..' and cannot contain path separators).";
          }
          // Check for other invalid characters
          if (/[<>:"|?*]/.test(value)) {
            return "Please enter a valid project name (cannot contain < > : \" | ? * characters).";
          }
          return true;
        },
      });
    }
    if (!cliArgs.type) {
      questions.push({
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
      });
    }
    questions.push({
      type: "select",
      name: "contextSource",
      message: "How would you like to set up your project context?",
      choices: [
        { title: "Generate new context (Anonymous)", value: "generate_anon" },
        { title: "Retrieve context with a Source ID", value: "retrieve_source" },
        { title: "Import existing context from your account", value: "import_auth" },
        { title: "Start with basic template only", value: "template" },
      ],
      initial: 0,
    });
    questions.push({
      type: (prev: string) => (prev === "generate_anon" ? "text" : null),
      name: "contextDescription",
      message: "Describe your project idea (the more detail, the better):",
      validate: (value: string) =>
        value.length > 10
          ? true
          : "Please provide a more detailed description (at least 10 characters).",
    });
    questions.push({
        type: (prev: string) => (prev === "retrieve_source" ? "text" : null),
        name: "sourceId",
        message: "Please enter your Source ID to retrieve context:",
    });
    questions.push({
      type: (prev: string, values: any) =>
        values.contextSource === "import_auth" ? "text" : null,
      name: "email",
      message: "Please enter your email to fetch existing context:",
      validate: (value: string) =>
        /^\S+@\S+\.\S+$/.test(value)
          ? true
          : "Please enter a valid email address.",
    });
    questions.push({
      type: (prev: string, values: any) =>
        values.contextSource === "import_auth" && !cliArgs.project ? "text" : null,
      name: "projectId",
      message:
        "Paste your Project ID (or leave blank to select interactively):",
      validate: (value: string) =>
        value.length === 0 || /^[a-zA-Z0-9_-]+$/.test(value)
          ? true
          : "Invalid Project ID format.",
    });
    const response = await prompts(questions);
    projectName = cliArgs.name ? String(cliArgs.name) : response.name;
    projectType = cliArgs.type ? String(cliArgs.type) : response.type;

    if (response.contextSource === "generate_anon") {
      contextMode = 'generate_anon';
      generateNewContext = true;
      contextDescription = response.contextDescription;
    } else if (response.contextSource === "retrieve_source") {
        contextMode = 'retrieve_source';
        sourceId = response.sourceId;
    } else if (response.contextSource === "import_auth") {
      contextMode = 'import_auth';
      fetchGenerations = true;
      email = response.email;
      projectId = response.projectId || undefined;
    } else {
      contextMode = 'template';
    }
  }

  if (!projectName || !projectType) {
    console.log(chalk.red("Exiting: Project name and type are required."));
    process.exit(1);
  }

  // Handle '.' as current directory
  let usingCurrentDir = false;
  let projectPath = "";
  if (projectName === ".") {
    usingCurrentDir = true;
    projectPath = process.cwd();
    projectName = path.basename(process.cwd());
  } else {
    // Validate project name
    if (projectName === ".." || projectName.includes("/") || projectName.includes("\\")) {
      console.log(chalk.red("Error: Invalid project name. Cannot be '..' and cannot contain path separators."));
      process.exit(1);
    }
    if (/[<>:"|?*]/.test(projectName)) {
      console.log(chalk.red("Error: Invalid project name. Cannot contain < > : \" | ? * characters."));
      process.exit(1);
    }
    projectPath = path.join(process.cwd(), projectName);
  }

  // Check if project directory already exists (unless using current dir)
  if (!usingCurrentDir && fs.existsSync(projectPath)) {
    console.log(
      chalk.red(
        `Error: Directory '${projectName}' already exists. Please choose a different project name.`,
      ),
    );
    process.exit(1);
  }

  // If using current dir, check if not empty and warn (unless --yes)
  if (usingCurrentDir) {
    const files = fs.readdirSync(projectPath).filter(f => f !== ".DS_Store" && f !== ".git" && f !== "node_modules");
    if (files.length > 0 && !cliArgs.yes) {
      const confirm = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Current directory is not empty. Continue and scaffold into it?`,
        initial: false,
      });
      if (!confirm.proceed) {
        console.log(chalk.red('Aborted.')); process.exit(1);
      }
    }
  }

  const templatePath = path.join(__dirname, "../templates", projectType);
  const contextPath = path.join(projectPath, "_my_context");

  console.log(
    chalk.cyan(
      `\n🚀 Creating your project: ${projectName} (${projectType} type)...`,
    ),
  );

  try {
    // 2. Create Project Directory (skip if using current dir)
    if (!usingCurrentDir) {
      console.log(chalk.gray(`- Creating project directory: ${projectName}`));
      fs.mkdirSync(projectName, { recursive: true });
      process.chdir(projectName);
    }

    // 3. Copy Template Files based on project type
    console.log(chalk.gray(`- Copying ${projectType} template files...`));
    if (usingCurrentDir) {
      // Debug: print all files in the template directory
      const templateFiles = fs.readdirSync(templatePath);
      console.log('[DEBUG] Files in templatePath:', templateFiles);

      for (const file of templateFiles) {
        console.log('[DEBUG] Copying', path.join(templatePath, file), 'to', path.join(projectPath, file));
        copySync(
          path.join(templatePath, file),
          path.join(projectPath, file),
          { overwrite: true }
        );
      }
    } else {
      copySync(templatePath, projectPath, { overwrite: true });
    }

    // Debug: print projectPath and its contents
    console.log('[DEBUG] projectPath:', projectPath);
    console.log('[DEBUG] Files in projectPath after copy:', fs.readdirSync(projectPath));

    // --- Add this block to ensure package.json is present before install ---
    const pkgPath = path.join(projectPath, 'package.json');
    let pkgTries = 0;
    while (!fs.existsSync(pkgPath) && pkgTries < 20) {
      await new Promise(res => setTimeout(res, 50));
      pkgTries++;
    }
    if (!fs.existsSync(pkgPath)) {
      throw new Error('package.json was not found after copying template files.');
    }

    // Ensure _my_context directory exists
    fs.mkdirSync(contextPath, { recursive: true });
    emptyDirSync(contextPath); // Clear existing template context files if any

    // 4. Inject context (generate/import/template)
    let didInjectContext = false;
    let injectedProjectId = projectId;
    let injectedSourceId = sourceId;

    if (contextMode === 'retrieve_source' && sourceId) {
        console.log(chalk.gray(`- Fetching context for Source ID: ${sourceId}...`));
        if (!sourceId) throw new Error('Source ID is required for retrieve_source mode.');
        const files = await getContextBySourceId(sourceId);
        for (const [fileName, content] of Object.entries(files)) {
            fs.writeFileSync(path.join(contextPath, fileName), typeof content === 'string' ? content : String(content), 'utf8');
        }
        didInjectContext = true;
        injectedSourceId = sourceId; // for logging
    } else if (contextMode === 'generate_anon' && generateNewContext && contextDescription) {
      // Anonymous generation doesn't require verification for now
      // Generate context
      console.log(chalk.gray('- Generating new context files anonymously...'));
      if (!contextDescription) throw new Error('Context description is required for anonymous generation.');
      const generationResult = await generateAnonymousContext(contextDescription, projectType);
      const files = generationResult.files;
      injectedSourceId = generationResult.sourceId; // Capture the new sourceId

      for (const [fileName, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(contextPath, fileName), typeof content === 'string' ? content : String(content), 'utf8');
      }
      didInjectContext = true;

    } else if (contextMode === 'import_auth' && fetchGenerations && email) {
      // Email verification (if not already verified)
      if (!verified) {
        if (!code) {
          await sendVerificationCode(email);
          process.stdout.write(chalk.yellow(`A verification code has been sent to ${email}\nPlease enter the code: `));
          code = (await prompts({ type: 'text', name: 'code', message: '' })).code;
        }
        const isVerified = await verifyCode(email, code as string);
        if (!isVerified) {
          console.log(chalk.red('Email verification failed. Exiting.'));
          process.exit(1);
        }
        verified = true;
      }
      // Fetch generations
      console.log(chalk.gray('- Fetching context files from mycontext.fbien.com...'));
      let generations = await getGenerations(email, projectId);
      if (!generations.length) {
        console.log(chalk.red('No context generations found for this email/project. Exiting.'));
        process.exit(1);
      }
      // If no projectId provided and multiple projects, prompt user to select
      if (!projectId) {
        const uniqueProjectIds = extractProjectIds(generations);
        if (uniqueProjectIds.length > 1) {
          const { selectedProjectId } = await prompts({
            type: 'select',
            name: 'selectedProjectId',
            message: 'Multiple projects found. Select a Project ID:',
            choices: uniqueProjectIds.map((id) => ({ title: id, value: id })),
          });
          generations = generations.filter((gen) => gen.id.startsWith(`${selectedProjectId}_`));
          injectedProjectId = selectedProjectId;
        } else if (uniqueProjectIds.length === 1) {
          injectedProjectId = uniqueProjectIds[0];
        }
      }
      // Write all files from selected project
      for (const gen of generations) {
        if (gen.files) {
          try {
            const filesObj = JSON.parse(gen.files);
            for (const [fileName, content] of Object.entries(filesObj)) {
              fs.writeFileSync(path.join(contextPath, fileName), typeof content === 'string' ? content : String(content), 'utf8');
            }
          } catch (e) {
            // fallback: write content as a single file
            fs.writeFileSync(path.join(contextPath, gen.documentType), gen.content, 'utf8');
          }
        } else {
          fs.writeFileSync(path.join(contextPath, gen.documentType), gen.content, 'utf8');
        }
      }
      didInjectContext = true;
    } else if (contextMode === 'template') {
      // Copy template context files (already done by template copy above, but ensure _my_context exists)
      if (!fs.existsSync(contextPath)) {
        fs.mkdirSync(contextPath, { recursive: true });
      }
      // No-op: template context files are already present
      didInjectContext = true;
    }
    // Print dashboard link if context was injected and projectId is available
    if (didInjectContext) {
        if (injectedProjectId) {
            console.log(chalk.green('\n✅ Authenticated context files generated successfully!'));
      console.log(chalk.blueBright('\n🔗 Review your context files online:'));
      const dashboardUrl = `https://mycontext.fbien.com/projects/${injectedProjectId}`;
      console.log(chalk.underline(`${dashboardUrl}`));
      console.log(chalk.gray('(cmd+click to open in supported terminals)'));
        } else if (injectedSourceId) {
            console.log(chalk.green('\n✅ Anonymous context files generated successfully!'));
            console.log(chalk.yellowBright(`\n🔒 IMPORTANT: Save this Source ID to retrieve your context later.`));
            console.log(chalk.white(`   Source ID: ${injectedSourceId}`));
        }
        console.log('\nOr, browse the _my_context/ folder in your project to see all generated files.\n');
    }

   
    // 6. Run shadcn/ui initialization
    console.log(
      chalk.gray("- Initializing shadcn/ui... (This may take a moment)"),
    );
    execSync("pnpm dlx shadcn@latest init", { stdio: "inherit" });
    execSync("pnpm add next@latest react@latest react-dom@latest", { stdio: "inherit" });
    execSync("rm -rf .next node_modules pnpm-lock.yaml && pnpm install", { stdio: "inherit" });

    // 7. Print Next Steps
    console.log(
      chalk.green(`\n🎉 Project ${projectName} created successfully! 🎉`),
    );
    console.log(chalk.white("\nNext steps:"));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan("  pnpm dev"));
    console.log(chalk.white("\nHappy coding! 🚀"));
  } catch (error: any) {
    console.error(
      chalk.red(`\nAn error occurred during scaffolding: ${error.message}`),
    );
    // Clean up created directory if an error occurred during setup
    const currentDir = process.cwd();
    const expectedPath = path.join(path.dirname(currentDir), projectName);
    if (currentDir === expectedPath || currentDir.endsWith(projectName)) {
      process.chdir(".."); // Move out of the newly created directory
      console.log(
        chalk.yellow(
          `Attempting to clean up partially created directory: ${projectName}`,
        ),
      );
      try {
        fs.rmSync(projectName, { recursive: true, force: true });
        console.log(chalk.yellow(`Cleaned up ${projectName}.`));
      } catch (cleanupError: any) {
        console.error(
          chalk.red(`Error during cleanup: ${cleanupError.message}`),
        );
      }
    }
    process.exit(1);
  }
}

/**
 * Extracts unique project IDs from a list of generations by parsing the id field.
 * Assumes id format: <projectId>_<documentType>_<timestamp>
 */
function extractProjectIds(generations: Generation[]): string[] {
  const projectIds = new Set<string>();
  generations.forEach((gen) => {
    const match = gen.id.match(/^([^_]+)_/);
    if (match && match[1]) {
      projectIds.add(match[1]);
    }
  });
  return Array.from(projectIds);
}

/**
 * Retrieves context files for a given anonymous sourceId from the mycontext.fbien.com API.
 * @param sourceId - The anonymous source ID.
 * @returns Promise resolving to a Record of file names to content.
 */
async function getContextBySourceId(sourceId: string): Promise<Record<string, string>> {
    const url = `https://mycontext.fbien.com/api/generations/cli/${sourceId}`;
    const headers = { "Content-Type": "application/json" };
    try {
        const response = await fetch(url, { headers });
        const raw = await response.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (jsonErr) {
            console.error(chalk.red(`\n[API ERROR] Could not parse JSON from /api/generations/cli. Raw response:`));
            console.error(raw);
            throw new Error('API did not return valid JSON.');
        }
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data.files || {};
    } catch (error) {
        console.error(chalk.red(`Failed to fetch context by Source ID: ${error}`));
        throw error;
    }
}


/**
 * Fetches context generations for a given email (and optional project) from the mycontext.fbien.com API.
 * @param email - The user's email address.
 * @param project - Optional project ID to filter generations.
 * @returns Promise resolving to an array of Generation objects.
 */
async function getGenerations(
  email: string,
  project?: string,
): Promise<Generation[]> {
  let url = `https://mycontext.fbien.com/api/generations?email=${encodeURIComponent(email)}`;
  if (project) {
    url += `&project=${encodeURIComponent(project)}`;
  }
  const headers = { "Content-Type": "application/json" };
  try {
    const response = await fetch(url, { headers });
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (jsonErr) {
      console.error(chalk.red(`\n[API ERROR] Could not parse JSON from /api/generations. Raw response:`));
      console.error(raw);
      throw new Error('API did not return valid JSON.');
    }
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data.generations;
  } catch (error) {
    console.error(chalk.red(`Failed to fetch generations: ${error}`));
    throw error;
  }
}

/**
 * Generates new anonymous context from a project description using the MyContext API.
 * @param description - The project description/idea provided by the user.
 * @param projectType - The type of project ("full" or "landing").
 * @returns Promise resolving to an object containing files and the sourceId.
 */
async function generateAnonymousContext(
  description: string,
  projectType: string,
): Promise<{ files: Record<string, string>, sourceId: string }> {
  const url = "https://mycontext.fbien.com/api/generations/cli";
  const headers = { "Content-Type": "application/json" };

  const body = {
    description,
    projectType,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (jsonErr) {
      console.error(chalk.red(`\n[API ERROR] Could not parse JSON from /api/generations/cli. Raw response:`));
      console.error(raw);
      throw new Error('API did not return valid JSON.');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    if (!data.sourceId || !data.files) {
        throw new Error('API response did not include sourceId and files for anonymous generation.');
    }

    return { files: data.files, sourceId: data.sourceId };
  } catch (error) {
    console.error(chalk.red(`Failed to generate anonymous context: ${error}`));
    throw error;
  }
}


/**
 * Generates new context from a project description using the MyContext API.
 * @param description - The project description/idea provided by the user.
 * @param projectType - The type of project ("full" or "landing").
 * @param email - Optional email for tracking and authentication.
 * @returns Promise resolving to a Record of file names to content.
 */
async function generateContextFromDescription(
  description: string,
  projectType: string,
  email?: string,
): Promise<Record<string, string>> {
  const url = "https://mycontext.fbien.com/api/generate-context";
  const headers = { "Content-Type": "application/json" };

  const body = {
    description,
    projectType,
    email: email || undefined,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (jsonErr) {
      console.error(chalk.red(`\n[API ERROR] Could not parse JSON from /api/generate-context. Raw response:`));
      console.error(raw);
      throw new Error('API did not return valid JSON.');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.files || {};
  } catch (error) {
    console.error(chalk.red(`Failed to generate context: ${error}`));
    throw error;
  }
}

/**
 * Sends a verification code to the user's email via the MyContext API.
 * @param email - The user's email address.
 * @returns Promise resolving to true if sent, throws on error.
 */
async function sendVerificationCode(email: string): Promise<boolean> {
  const url = "https://mycontext.fbien.com/api/send-verification-code";
  const headers = { "Content-Type": "application/json" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to send verification code: ${error}`));
    throw error;
  }
}

/**
 * Verifies the code sent to the user's email via the MyContext API.
 * @param email - The user's email address.
 * @param code - The verification code entered by the user.
 * @returns Promise resolving to true if verified, false otherwise.
 */
async function verifyCode(email: string, code: string): Promise<boolean> {
  const url = "https://mycontext.fbien.com/api/verify-code";
  const headers = { "Content-Type": "application/json" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) {
      return false;
    }
    return data.verified === true;
  } catch (error) {
    console.error(chalk.red(`Failed to verify code: ${error}`));
    return false;
  }
}

main();
