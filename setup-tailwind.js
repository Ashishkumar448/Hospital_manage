const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appsDir = path.join(__dirname, 'apps');
const packagesDir = path.join(__dirname, 'packages');

const tailwindConfigTemplate = `import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Pick<Config, "content" | "presets"> = {
  content: [
    "./src/app/**/*.tsx",
    "./app/**/*.tsx",
    "./src/pages/**/*.tsx",
    "./src/components/**/*.tsx",
    "../../packages/ui/src/**/*.tsx",
  ],
  presets: [sharedConfig],
};
export default config;
`;

const postcssConfigTemplate = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const globalsCssTailwind = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0d1117;
  --foreground: #c9d1d9;
}

body {
  color: var(--foreground);
  background: var(--background);
}
`;

function setupApp(appPath) {
  if (!fs.existsSync(appPath)) return;
  console.log(`Setting up Tailwind in ${appPath}`);

  // Write configs
  fs.writeFileSync(path.join(appPath, 'tailwind.config.ts'), tailwindConfigTemplate);
  fs.writeFileSync(path.join(appPath, 'postcss.config.js'), postcssConfigTemplate);

  // Install dependencies
  execSync('pnpm add -D tailwindcss postcss autoprefixer @repo/tailwind-config@workspace:*', { cwd: appPath, stdio: 'inherit' });

  // Update globals.css if it exists
  const globalsPath1 = path.join(appPath, 'app', 'globals.css');
  const globalsPath2 = path.join(appPath, 'src', 'app', 'globals.css');
  if (fs.existsSync(globalsPath1)) {
    fs.writeFileSync(globalsPath1, globalsCssTailwind);
  } else if (fs.existsSync(globalsPath2)) {
    fs.writeFileSync(globalsPath2, globalsCssTailwind);
  }
}

// Setup all apps
const apps = ['admin', 'doctor', 'executives', 'otherst', 'user'];
apps.forEach(app => setupApp(path.join(appsDir, app)));

// Setup ui package
const uiPath = path.join(packagesDir, 'ui');
console.log(`Setting up Tailwind in UI package`);
fs.writeFileSync(path.join(uiPath, 'tailwind.config.ts'), tailwindConfigTemplate.replace('"../../packages/ui/src/**/*.tsx",', ''));
fs.writeFileSync(path.join(uiPath, 'postcss.config.js'), postcssConfigTemplate);
execSync('pnpm add -D tailwindcss postcss autoprefixer @repo/tailwind-config@workspace:*', { cwd: uiPath, stdio: 'inherit' });

console.log('Tailwind setup complete.');
