import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { generateOpenApiDocument } from './generate-openapi';

const nodeRequire = createRequire(__filename);

function getSwaggerUiAssetsPath(): string {
  return dirname(nodeRequire.resolve('swagger-ui-dist/package.json'));
}

export function setupSwagger(app: INestApplication): void {
  const document = generateOpenApiDocument() as unknown as OpenAPIObject;
  SwaggerModule.setup('v1/docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'v1/docs-json',
    customSwaggerUiPath: getSwaggerUiAssetsPath(),
  });
}
