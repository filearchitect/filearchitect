import { createStructureFromString } from "file-architect-core";

// Example: Template-based project generator
async function generateFromTemplate(options) {
  const {
    projectName,
    language = "typescript",
    testing = "jest",
    linting = "eslint",
    database = "postgres",
  } = options;

  // Define template files content
  const templates = {
    typescript: {
      "tsconfig.json": `{
        "compilerOptions": {
          "target": "ES2020",
          "module": "ESNext",
          "moduleResolution": "node",
          "esModuleInterop": true,
          "strict": true,
          "outDir": "./dist"
        },
        "include": ["src"],
        "exclude": ["node_modules", "dist"]
      }`,
      "src/types.ts": `
        export interface User {
          id: string;
          name: string;
          email: string;
        }

        export interface Config {
          port: number;
          database: {
            host: string;
            port: number;
            name: string;
          }
        }
      `,
    },
    jest: {
      "jest.config.js": `
        export default {
          preset: 'ts-jest',
          testEnvironment: 'node',
          extensionsToTreatAsEsm: ['.ts'],
          moduleNameMapper: {
            '^(\\.{1,2}/.*)\\.js$': '$1',
          },
        };
      `,
      "src/__tests__/setup.ts": `
        import { beforeAll, afterAll } from '@jest/globals';
        
        beforeAll(async () => {
          // Setup test environment
        });
        
        afterAll(async () => {
          // Cleanup test environment
        });
      `,
    },
    eslint: {
      ".eslintrc.json": `{
        "extends": [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended"
        ],
        "parser": "@typescript-eslint/parser",
        "plugins": ["@typescript-eslint"],
        "root": true
      }`,
    },
    database: {
      postgres: {
        "src/db/index.ts": `
          import { Pool } from 'pg';
          
          export const pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
          });
        `,
        "src/db/migrations/001_initial.sql": `
          CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `,
      },
    },
  };

  // Create base structure
  const baseStructure = `
    ${projectName}
      src
        config
          index.ts
        db
          migrations
        models
        services
        utils
        app.ts
        index.ts
      tests
        unit
        integration
        e2e
      docs
        API.md
        SETUP.md
      scripts
        build.sh
        test.sh
      .env.example
      .gitignore
      README.md
      package.json
  `;

  // Create the base structure
  await createStructureFromString(baseStructure, "./", { verbose: true });

  // Add template files based on options
  const templateStructure = `
    ${projectName}
      ${Object.entries(templates[language])
        .map(([file, content]) => `[${Buffer.from(content)}] > ${file}`)
        .join("\n      ")}
      ${Object.entries(templates[testing])
        .map(([file, content]) => `[${Buffer.from(content)}] > ${file}`)
        .join("\n      ")}
      ${Object.entries(templates[linting])
        .map(([file, content]) => `[${Buffer.from(content)}] > ${file}`)
        .join("\n      ")}
      ${Object.entries(templates.database[database])
        .map(([file, content]) => `[${Buffer.from(content)}] > ${file}`)
        .join("\n      ")}
  `;

  await createStructureFromString(templateStructure, "./");

  // Add package.json with dependencies based on options
  const packageJson = {
    name: projectName,
    version: "0.0.1",
    type: "module",
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsx watch src/index.ts",
      test: testing === "jest" ? "jest" : "vitest",
      lint: linting === "eslint" ? "eslint src" : "tslint src",
    },
    dependencies: {
      ...(database === "postgres"
        ? { pg: "^8.11.3", "@types/pg": "^8.10.3" }
        : {}),
    },
    devDependencies: {
      typescript: "^5.2.2",
      tsx: "^3.13.0",
      ...(testing === "jest"
        ? {
            jest: "^29.7.0",
            "ts-jest": "^29.1.1",
            "@types/jest": "^29.5.5",
          }
        : {
            vitest: "^0.34.4",
          }),
      ...(linting === "eslint"
        ? {
            eslint: "^8.49.0",
            "@typescript-eslint/eslint-plugin": "^6.7.0",
            "@typescript-eslint/parser": "^6.7.0",
          }
        : {
            tslint: "^6.1.3",
          }),
    },
  };

  await createStructureFromString(
    `
    ${projectName}
      [${Buffer.from(JSON.stringify(packageJson, null, 2))}] > package.json
  `,
    "./"
  );

  console.log(`✨ Project ${projectName} created successfully with:`);
  console.log(`- Language: ${language}`);
  console.log(`- Testing: ${testing}`);
  console.log(`- Linting: ${linting}`);
  console.log(`- Database: ${database}`);

  console.log("\nNext steps:");
  console.log(`1. cd ${projectName}`);
  console.log("2. pnpm install");
  console.log("3. pnpm dev");
}

// Create a new project with specific options
generateFromTemplate({
  projectName: "my-backend-app",
  language: "typescript",
  testing: "jest",
  linting: "eslint",
  database: "postgres",
}).catch(console.error);
