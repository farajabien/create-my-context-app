import prompts, { PromptObject } from "prompts";
import { execSync } from "child_process";
import { copySync, emptyDirSync } from "fs-extra";
import path from "path";
import chalk from "chalk"; // For colorful output
import fs from "fs";
import fetch from "node-fetch";

async function main() {
  console.log(chalk.blue("✨ Welcome to the MyContext App Scaffolder! ✨"));

  // 1. Prompt for project name and type
  const questions: PromptObject<any>[] = [
    {
      type: "text",
      name: "name",
      message: "What is your project name?",
      validate: (value: string) =>
        value.length > 0 ? true : "Please enter a project name.",
    },
    {
      type: "select",
      name: "type",
      message: "What type of project do you want to create?",
      choices: [
        { title: "Full App (with full Next.js structure)", value: "full" },
        { title: "Landing Page (optimized for simple landing pages)", value: "landing" },
      ],
      initial: 0,
    },
    {
      type: "confirm",
      name: "fetchGenerations",
      message: "Do you want to fetch existing context generations (PRD, user stories, etc.) based on an email?",
      initial: false,
    },
    {
      type: (prev: boolean) => (prev ? "text" : null),
      name: "email",
      message: "Please enter your email to fetch generations:",
      validate: (value: string) =>
        /^\S+@\S+\.\S+$/.test(value) ? true : "Please enter a valid email address.",
    },
  ];

  const response = await prompts(questions);

  const projectName = response.name;
  const projectType = response.type;
  const fetchGenerations = response.fetchGenerations;
  const email = response.email;

  if (!projectName || !projectType) {
    console.log(chalk.red("Exiting: Project name and type are required."));
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), projectName);
  const templatePath = path.join(__dirname, "../templates", projectType);
  const contextPath = path.join(projectPath, "_my_context");

  console.log(chalk.cyan(`\n🚀 Creating your project: ${projectName} (${projectType} type)...`));

  try {
    // 2. Create Project Directory
    console.log(chalk.gray(`- Creating project directory: ${projectName}`));
    execSync(`mkdir ${projectName}`);
    process.chdir(projectName);

    // 3. Run `pnpm dlx shadcn@latest init`
    console.log(chalk.gray("- Initializing shadcn/ui... (This may take a moment)"));
    execSync("pnpm dlx shadcn@latest init", { stdio: "inherit" });

    // 4. Copy Template Files based on project type
    console.log(chalk.gray(`- Copying ${projectType} template files...`));
    copySync(templatePath, process.cwd(), { overwrite: true });

    // Ensure _my_context directory exists before fetching generations
    emptyDirSync(contextPath); // Clear existing template context files if any

    // 5. Optionally fetch and inject context generations
    if (fetchGenerations && email) {
      console.log(chalk.gray(`- Fetching context generations for ${email}...`));
      try {
        let generations = await getGenerations(email);
        if (generations && generations.length > 0) {
          const projectIds = extractProjectIds(generations);
          let selectedProject: string | null = null;
          if (projectIds.length > 1) {
            // Prompt user to select a project
            const projectResponse = await prompts({
              type: "select",
              name: "projectId",
              message: "Multiple projects found. Which project do you want to import?",
              choices: projectIds.map((id) => ({ title: id, value: id })),
              initial: 0,
            });
            selectedProject = projectResponse.projectId;
          } else if (projectIds.length === 1) {
            selectedProject = projectIds[0];
          }
          if (selectedProject) {
            // Fetch only the selected project's generations
            generations = await getGenerations(email, selectedProject);
            console.log(chalk.green(`  Found ${generations.length} generations for project '${selectedProject}'. Injecting into _my_context/.`));
          } else {
            console.log(chalk.yellow("  No project selected. Skipping context injection."));
            generations = [];
          }
          generations.forEach((gen: Generation) => {
            const fileName = gen.documentType;
            const content = gen.content;
            if (fileName && content) {
              const filePath = path.join(contextPath, fileName);
              fs.writeFileSync(filePath, content, "utf8");
              console.log(chalk.gray(`    - Wrote ${fileName}`));
            }
          });
        } else {
          console.log(chalk.yellow("  No generations found for this email."));
        }
      } catch (error: any) {
        console.error(chalk.red(`  Error fetching generations: ${error.message}`));
        console.log(chalk.yellow("  Continuing without fetching generations."));
      }
    } else if (fetchGenerations && !email) {
      console.log(chalk.yellow("Email not provided. Skipping context generation fetch."));
    }

    // 6. Install Dependencies (`pnpm install`)
    console.log(chalk.gray("- Installing dependencies... (This may take a moment)"));
    execSync("pnpm install", { stdio: "inherit" });

    // 7. Print Next Steps
    console.log(chalk.green(`\n🎉 Project ${projectName} created successfully! 🎉`));
    console.log(chalk.white("\nNext steps:"));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan("  pnpm dev"));
    console.log(chalk.white("\nHappy coding! 🚀"));

  } catch (error: any) {
    console.error(chalk.red(`\nAn error occurred during scaffolding: ${error.message}`));
    // Clean up created directory if an error occurred during setup
    if (projectName && path.resolve(process.cwd()) === path.join(process.cwd(), projectName)) {
      process.chdir('..'); // Move out of the newly created directory
      console.log(chalk.yellow(`Attempting to clean up partially created directory: ${projectName}`));
      try {
        execSync(`rm -rf ${projectName}`);
        console.log(chalk.yellow(`Cleaned up ${projectName}.`));
      } catch (cleanupError: any) {
        console.error(chalk.red(`Error during cleanup: ${cleanupError.message}`));
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
 * Fetches context generations for a given email (and optional project) from the mycontext.fbien.com API.
 * @param email - The user's email address.
 * @param project - Optional project ID to filter generations.
 * @returns Promise resolving to an array of Generation objects.
 */
interface Generation {
  id: string;
  content: string;
  documentType: string;
  files?: string;
  createdAt?: string;
}

async function getGenerations(email: string, project?: string): Promise<Generation[]> {
  let url = `https://mycontext.fbien.com/api/generations?email=${encodeURIComponent(email)}`;
  if (project) {
    url += `&project=${encodeURIComponent(project)}`;
  }
  const headers = { 'Content-Type': 'application/json' };
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data.generations;
  } catch (error) {
    console.error(chalk.red(`Failed to fetch generations: ${error}`));
    throw error;
  }
}

main();