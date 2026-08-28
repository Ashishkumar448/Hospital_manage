import fs from 'fs';
import path from 'path';

const apps = ['admin', 'doctor', 'executives', 'otherst', 'user'];
const nextConfigPath = (app) => path.join(process.cwd(), `apps/${app}/next.config.js`);

const newContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/firebase"],
};

export default nextConfig;
`;

apps.forEach(app => {
  fs.writeFileSync(nextConfigPath(app), newContent);
  console.log(`Updated ${app}/next.config.js`);
});
