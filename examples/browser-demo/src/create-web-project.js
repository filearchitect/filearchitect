import { createStructureFromString } from "file-architect-core";

// Example: Create a typical React project structure
async function createWebProject(projectName) {
  const projectStructure = `
    ${projectName}
      src
        components
          Button.jsx
          Card.jsx
          Header.jsx
          Footer.jsx
        pages
          Home.jsx
          About.jsx
          Contact.jsx
        assets
          styles
            main.css
            variables.css
          images
            logo.svg
        utils
          api.js
          helpers.js
        App.jsx
        main.jsx
        index.css
      public
        index.html
        favicon.ico
        robots.txt
      tests
        components
          Button.test.jsx
          Card.test.jsx
        utils
          helpers.test.js
      docs
        README.md
        CONTRIBUTING.md
      package.json
      vite.config.js
      .gitignore
      .eslintrc.json
      tsconfig.json
  `;

  // Create the project structure
  await createStructureFromString(projectStructure, "./", {
    verbose: true, // Enable verbose logging
  });

  // Add some initial content to key files
  const packageJson = {
    name: projectName,
    version: "0.0.1",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      test: "vitest",
      lint: "eslint src",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.16.0",
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.0.4",
      vite: "^4.4.9",
      vitest: "^0.34.4",
      eslint: "^8.49.0",
    },
  };

  const viteConfig = `
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        port: 3000
      }
    });
  `;

  const gitignore = `
    node_modules
    dist
    .env
    .DS_Store
    coverage
    *.log
  `;

  const readme = `
    # ${projectName}

    A modern React application created with Vite.

    ## Getting Started

    1. Install dependencies:
       \`\`\`bash
       pnpm install
       \`\`\`

    2. Start development server:
       \`\`\`bash
       pnpm dev
       \`\`\`

    3. Build for production:
       \`\`\`bash
       pnpm build
       \`\`\`

    ## Available Scripts

    - \`pnpm dev\` - Start development server
    - \`pnpm build\` - Build for production
    - \`pnpm preview\` - Preview production build
    - \`pnpm test\` - Run tests
    - \`pnpm lint\` - Run ESLint
  `;

  // Write content to files
  await createStructureFromString(
    `
    ${projectName}
      [${Buffer.from(JSON.stringify(packageJson, null, 2))}] > package.json
      [${Buffer.from(viteConfig)}] > vite.config.js
      [${Buffer.from(gitignore)}] > .gitignore
      [${Buffer.from(readme)}] > docs/README.md
  `,
    "./"
  );

  console.log(`✨ Project ${projectName} created successfully!`);
  console.log("\nNext steps:");
  console.log(`1. cd ${projectName}`);
  console.log("2. pnpm install");
  console.log("3. pnpm dev");
}

// Create a new project
createWebProject("my-awesome-app").catch(console.error);
