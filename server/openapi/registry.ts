import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();

export function buildOpenApi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Generated API',
      version: '1.0.0',
      description: 'Auto-generated from Zod schemas and route registrations.',
    },
    servers: [],
  });
}
