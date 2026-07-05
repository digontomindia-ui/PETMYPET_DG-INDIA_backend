import swaggerJSDoc from 'swagger-jsdoc';
import { env, isProduction } from '../config/env.js';

const swaggerDefinition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: `${env.APP_NAME} API`,
    version: '1.0.0',
    description: 'Production REST API for the Patmypets multi-service pet care platform.',
  },
  servers: [{ url: `/api/${env.API_VERSION}` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Detail of what went wrong' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const sourceRoot = isProduction ? './dist/modules' : './src/modules';

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [
    `${sourceRoot}/**/*.routes.${isProduction ? 'js' : 'ts'}`,
    `${sourceRoot}/**/*.docs.${isProduction ? 'js' : 'ts'}`,
  ],
});
