const fs = require('fs');
const path = require('path');

const configuredUrl = (process.env.API_BASE_URL || '').trim().replace(/\/$/, '');
const isVercelBuild = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const defaultUrl = configuredUrl || (isVercelBuild ? 'https://getjob-production-b76c.up.railway.app' : 'http://localhost:3000');
const outputPath = path.resolve(__dirname, '../src/app/api-config.generated.ts');
const contents = `// Generated before each frontend build. Do not edit manually.\nexport const GENERATED_API_BASE_URL = ${JSON.stringify(defaultUrl)};\n`;

fs.writeFileSync(outputPath, contents, 'utf8');
console.log(`Using API base URL: ${defaultUrl}`);
