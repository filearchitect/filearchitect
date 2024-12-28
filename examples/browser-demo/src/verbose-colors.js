import chalk from "chalk";
import { createStructureFromString } from "file-architect-core";

// Example: Create a project with verbose colored output
async function createColoredDemo() {
  console.log(
    chalk.blue.bold("\n📦 Creating demo project with colored output\n")
  );

  const structure = `
    colored-demo
      src
        components
          ${chalk.green("Button.tsx")}         # A reusable button component
          ${chalk.green("Card.tsx")}           # A card container component
        styles
          ${chalk.magenta("variables.css")}    # CSS variables and theming
          ${chalk.magenta("components.css")}   # Component-specific styles
        utils
          ${chalk.yellow("logger.ts")}         # Logging utility functions
          ${chalk.yellow("validation.ts")}     # Input validation helpers
      config
        ${chalk.cyan("dev.json")}             # Development configuration
        ${chalk.cyan("prod.json")}            # Production configuration
      [${chalk.blue("~/Desktop/example.json")}] > data/settings.json
      (${chalk.red("~/old-project/utils/*")}] > src/utils/legacy/
  `;

  // Create the structure with verbose output
  await createStructureFromString(structure, "./output", {
    verbose: true,
  });

  // Add some example content
  const buttonComponent = `
    import React from 'react';
    import './Button.css';

    export interface ButtonProps {
      variant?: 'primary' | 'secondary';
      size?: 'small' | 'medium' | 'large';
      children: React.ReactNode;
      onClick?: () => void;
    }

    export const Button: React.FC<ButtonProps> = ({
      variant = 'primary',
      size = 'medium',
      children,
      onClick,
    }) => (
      <button
        className={\`button \${variant} \${size}\`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  `;

  const variables = `
    :root {
      /* Colors */
      --primary: #3b82f6;
      --secondary: #6b7280;
      --success: #10b981;
      --error: #ef4444;
      
      /* Typography */
      --font-sans: ui-sans-serif, system-ui, -apple-system;
      --font-mono: ui-monospace, monospace;
      
      /* Spacing */
      --spacing-1: 0.25rem;
      --spacing-2: 0.5rem;
      --spacing-4: 1rem;
      --spacing-8: 2rem;
    }
  `;

  await createStructureFromString(
    `
    colored-demo
      [${Buffer.from(buttonComponent)}] > src/components/Button.tsx
      [${Buffer.from(variables)}] > src/styles/variables.css
  `,
    "./output"
  );

  console.log(chalk.green.bold("\n✨ Demo project created successfully!\n"));
  console.log(chalk.yellow("Project structure:"));
  console.log(chalk.gray("colored-demo/"));
  console.log(chalk.gray("  ├── src/"));
  console.log(chalk.gray("  │   ├── components/"));
  console.log(chalk.gray("  │   │   ├── Button.tsx"));
  console.log(chalk.gray("  │   │   └── Card.tsx"));
  console.log(chalk.gray("  │   ├── styles/"));
  console.log(chalk.gray("  │   │   ├── variables.css"));
  console.log(chalk.gray("  │   │   └── components.css"));
  console.log(chalk.gray("  │   └── utils/"));
  console.log(chalk.gray("  │       ├── logger.ts"));
  console.log(chalk.gray("  │       └── validation.ts"));
  console.log(chalk.gray("  └── config/"));
  console.log(chalk.gray("      ├── dev.json"));
  console.log(chalk.gray("      └── prod.json"));
}

// Run the demo
createColoredDemo().catch(console.error);
