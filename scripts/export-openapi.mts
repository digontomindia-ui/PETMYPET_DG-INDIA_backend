import { writeFileSync } from 'node:fs';
import { swaggerSpec } from '../src/common/swagger/swagger.config.js';

writeFileSync('docs/openapi.json', JSON.stringify(swaggerSpec, null, 2) + '\n');
console.log('Wrote docs/openapi.json');
