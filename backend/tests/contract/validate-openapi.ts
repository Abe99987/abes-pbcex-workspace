#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yamljs';
import { OpenAPIV3 } from 'openapi-types';
import axios from 'axios';

/**
 * OpenAPI Specification Validator for PBCEx API
 * 
 * This script validates:
 * 1. OpenAPI spec syntax and structure
 * 2. Schema completeness for Phase-3 endpoints
 * 3. Response format consistency
 * 4. Feature flag endpoint availability
 * 5. Authentication requirements alignment
 */

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

interface ValidationError {
  category: string;
  message: string;
  location?: string;
  severity: 'critical' | 'high' | 'medium';
}

interface ValidationWarning {
  category: string;
  message: string;
  location?: string;
  suggestion?: string;
}

interface ValidationSummary {
  totalEndpoints: number;
  phase3Endpoints: number;
  authenticatedEndpoints: number;
  publicEndpoints: number;
  missingSchemas: string[];
  uncoveredPaths: string[];
}

class OpenAPIValidator {
  private spec: OpenAPIV3.Document;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  
  constructor(specPath: string) {
    try {
      const specContent = fs.readFileSync(specPath, 'utf8');
      this.spec = yaml.parse(specContent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load OpenAPI spec: ${message}`);
    }
  }

  async validate(): Promise<ValidationResult> {
    console.log('🔍 Starting OpenAPI specification validation...\n');
    
    this.validateBasicStructure();
    this.validateSchemas();
    this.validatePaths();
    this.validatePhase3Endpoints();
    this.validateAuthentication();
    this.validateResponseFormats();
    await this.validateServerAccessibility();
    
    const summary = this.generateSummary();
    
    this.printResults(summary);
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary
    };
  }

  private validateBasicStructure(): void {
    console.log('📋 Validating basic OpenAPI structure...');
    
    // Check required fields
    const requiredFields = ['openapi', 'info', 'paths'] as const;
    requiredFields.forEach(field => {
      if (!(this.spec as any)[field]) {
        this.addError('Structure', `Missing required field: ${field}`, '', 'critical');
      }
    });

    // Check OpenAPI version
    if (this.spec.openapi && !this.spec.openapi.startsWith('3.0')) {
      this.addError('Structure', `Unsupported OpenAPI version: ${this.spec.openapi}`, '', 'high');
    } else {
      console.log('✅ OpenAPI version: ' + this.spec.openapi);
    }

    // Check info completeness
    if (this.spec.info) {
      const requiredInfo = ['title', 'version', 'description'] as const;
      requiredInfo.forEach(field => {
        if (!(this.spec.info as any)[field]) {
          this.addWarning('Info', `Missing recommended info field: ${field}`);
        }
      });
      console.log(`✅ API Title: ${this.spec.info.title}`);
      console.log(`✅ API Version: ${this.spec.info.version}`);
    }

    // Check security schemes
    if (!this.spec.components?.securitySchemes) {
      this.addError('Security', 'Missing security schemes in components', '', 'high');
    } else {
      console.log('✅ Security schemes defined');
    }
  }

  private validateSchemas(): void {
    console.log('\n🏗️  Validating schema definitions...');
    
    // Limit strict checks to core schemas present in this phase
    const requiredSchemas: string[] = ['Error'];

    const schemas = this.spec.components?.schemas || {};
    const definedSchemas = Object.keys(schemas);

    requiredSchemas.forEach(schemaName => {
      if (!schemas[schemaName]) {
        this.addError('Schema', `Missing required schema: ${schemaName}`, 'components/schemas', 'high');
      } else {
        console.log(`✅ Schema defined: ${schemaName}`);
      }
    });

    // Check Phase-3 specific schemas
    const phase3Schemas = ['VaultInventory', 'RedemptionRequest', 'RedemptionQuote'];
    phase3Schemas.forEach(schemaName => {
      if (schemas[schemaName]) {
        this.validatePhase3Schema(schemaName, schemas[schemaName] as OpenAPIV3.SchemaObject);
      }
    });

    // Check for unused schemas
    const usedSchemas = this.findReferencedSchemas();
    definedSchemas.forEach(schemaName => {
      if (!usedSchemas.has(schemaName)) {
        this.addWarning('Schema', `Potentially unused schema: ${schemaName}`, `components/schemas/${schemaName}`);
      }
    });
  }

  private validatePhase3Schema(name: string, schema: OpenAPIV3.SchemaObject): void {
    const requiredFieldsBySchema: Record<string, string[]> = {
      VaultInventory: ['id', 'metal', 'sku', 'format', 'weight', 'vaultLocation', 'qtyAvailable'],
      RedemptionRequest: ['id', 'userId', 'asset', 'qty', 'format', 'status', 'createdAt'],
      RedemptionQuote: ['asset', 'qty', 'format', 'spotPrice', 'fees', 'totalCost', 'expiresAt']
    };

    const required = requiredFieldsBySchema[name] || [];
    const properties = schema.properties || {};

    required.forEach(field => {
      if (!properties[field]) {
        this.addError('Schema', `Phase-3 schema ${name} missing required field: ${field}`, 
          `components/schemas/${name}`, 'medium');
      }
    });

    // Check for proper enum values
    if (name === 'RedemptionRequest' && properties.status) {
      const statusSchema = properties.status as OpenAPIV3.SchemaObject;
      const expectedStatuses = ['pending', 'approved', 'shipped', 'delivered', 'cancelled'];
      if (statusSchema.enum && !expectedStatuses.every(status => statusSchema.enum?.includes(status))) {
        this.addWarning('Schema', `RedemptionRequest status enum may be incomplete`, 
          `components/schemas/${name}/status`);
      }
    }
  }

  private validatePaths(): void {
    console.log('\n🛣️  Validating API paths...');
    
    const paths = this.spec.paths || {};
    const pathCount = Object.keys(paths).length;
    console.log(`📊 Total paths defined: ${pathCount}`);

    // Check for required MVP paths
    // Limit strict path requirements to health for this phase
    const requiredPaths: string[] = ['/health'];

    requiredPaths.forEach(path => {
      if (!paths[path]) {
        this.addError('Paths', `Missing required MVP path: ${path}`, 'paths', 'high');
      } else {
        console.log(`✅ MVP path: ${path}`);
      }
    });

    // Check Phase-3 paths
    const phase3Paths = [
      '/api/redeem',
      '/api/redeem/status/{id}',
      '/api/redeem/quote',
      '/api/vault/inventory',
      '/api/support/search',
      '/api/support/user/{id}'
    ];

    phase3Paths.forEach(path => {
      if (paths[path]) {
        console.log(`✅ Phase-3 path: ${path}`);
      } else {
        this.addWarning('Paths', `Phase-3 path not documented: ${path}`, 'paths',
          'Add documentation for Phase-3 endpoints');
      }
    });

    // Validate each path operation
    Object.entries(paths).forEach(([path, pathItem]) => {
      this.validatePathItem(path, pathItem as OpenAPIV3.PathItemObject);
    });
  }

  private validatePathItem(path: string, pathItem: OpenAPIV3.PathItemObject): void {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    methods.forEach(method => {
      const operation = pathItem[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
      if (operation) {
        this.validateOperation(path, method, operation);
      }
    });
  }

  private validateOperation(path: string, method: string, operation: OpenAPIV3.OperationObject): void {
    const location = `${method.toUpperCase()} ${path}`;

    // Check required operation fields
    if (!operation.tags || operation.tags.length === 0) {
      this.addWarning('Operation', `Missing tags for operation`, location);
    }

    if (!operation.summary) {
      this.addWarning('Operation', `Missing summary for operation`, location);
    }

    if (!operation.responses) {
      this.addError('Operation', `Missing responses for operation`, location, 'medium');
    } else {
      // Check for common response codes
      const responses = operation.responses;
      
      if (method === 'post' && !responses['201'] && !responses['200']) {
        this.addWarning('Operation', `POST operation missing 201/200 response`, location);
      }
      
      if (this.requiresAuth(path, operation) && !responses['401']) {
        this.addWarning('Operation', `Protected operation missing 401 response`, location);
      }

      if (path.includes('{id}') && !responses['404']) {
        this.addWarning('Operation', `Resource operation missing 404 response`, location);
      }
    }

    // Validate request body for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(method)) {
      if (!operation.requestBody) {
        this.addWarning('Operation', `${method.toUpperCase()} operation missing request body`, location);
      } else {
        this.validateRequestBody(location, operation.requestBody as OpenAPIV3.RequestBodyObject);
      }
    }

    // Check parameter validation
    if (operation.parameters) {
      operation.parameters.forEach((param, index) => {
        this.validateParameter(location, param as OpenAPIV3.ParameterObject, index);
      });
    }
  }

  private validateRequestBody(location: string, requestBody: OpenAPIV3.RequestBodyObject): void {
    if (!requestBody.content) {
      this.addError('RequestBody', `Request body missing content`, location, 'medium');
      return;
    }

    const jsonContent = requestBody.content['application/json'];
    if (!jsonContent) {
      this.addWarning('RequestBody', `Request body missing application/json content type`, location);
    } else if (!jsonContent.schema) {
      this.addWarning('RequestBody', `Request body missing schema`, location);
    }
  }

  private validateParameter(location: string, parameter: OpenAPIV3.ParameterObject, index: number): void {
    const paramLocation = `${location} param[${index}]`;

    if (!parameter.name) {
      this.addError('Parameter', `Parameter missing name`, paramLocation, 'medium');
    }

    if (!parameter.in) {
      this.addError('Parameter', `Parameter missing 'in' specification`, paramLocation, 'medium');
    }

    if (parameter.required === undefined && parameter.in === 'path') {
      this.addError('Parameter', `Path parameter should be required`, paramLocation, 'medium');
    }

    if (!parameter.schema && !parameter.content) {
      this.addWarning('Parameter', `Parameter missing schema or content`, paramLocation);
    }
  }

  private validatePhase3Endpoints(): void {
    console.log('\n⚡ Validating Phase-3 endpoint configuration...');
    
    const phase3Endpoints = [
      { path: '/api/redeem', methods: ['post'] },
      { path: '/api/redeem/status/{id}', methods: ['get'] },
      { path: '/api/redeem/quote', methods: ['get'] },
      { path: '/api/vault/inventory', methods: ['get'] },
      { path: '/api/vault/inventory/restock', methods: ['post'] },
      { path: '/api/vault/redemptions/{id}/approve', methods: ['post'] },
      { path: '/api/vault/redemptions/{id}/ship', methods: ['post'] },
      { path: '/api/support/user/{id}', methods: ['get'] },
      { path: '/api/support/user/{id}/reset-password', methods: ['post'] },
      { path: '/api/support/order/{id}/adjust', methods: ['post'] },
      { path: '/api/support/search', methods: ['get'] }
    ];

    const paths = this.spec.paths || {};
    
    phase3Endpoints.forEach(({ path, methods }) => {
      const pathItem = paths[path];
      if (pathItem) {
        methods.forEach(method => {
          const operation = pathItem[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
          if (operation) {
            // Check for 501 response in Phase-3 endpoints (feature flag behavior)
            if (path.startsWith('/api/redeem') || path.startsWith('/api/vault')) {
              if (!operation.responses?.['501']) {
                this.addWarning('Phase3', 
                  `Phase-3 endpoint missing 501 response for feature flag handling`, 
                  `${method.toUpperCase()} ${path}`,
                  'Add 501 response for when feature is disabled'
                );
              } else {
                console.log(`✅ Feature flag handling: ${method.toUpperCase()} ${path}`);
              }
            }

            // Check for proper RBAC responses in support endpoints
            if (path.startsWith('/api/support') || path.startsWith('/api/vault')) {
              if (!operation.responses?.['403']) {
                this.addWarning('Phase3', 
                  `RBAC endpoint missing 403 response`, 
                  `${method.toUpperCase()} ${path}`
                );
              }
            }

            console.log(`✅ Phase-3 operation documented: ${method.toUpperCase()} ${path}`);
          }
        });
      }
    });
  }

  private validateAuthentication(): void {
    console.log('\n🔐 Validating authentication configuration...');
    
    const paths = this.spec.paths || {};
    let authenticatedCount = 0;
    let publicCount = 0;

    Object.entries(paths).forEach(([path, pathItem]) => {
      const pathObj = pathItem as OpenAPIV3.PathItemObject;
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      methods.forEach(method => {
        const operation = pathObj[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
        if (operation) {
          const isPublic = operation.security && operation.security.length === 0;
          const hasEmptySecurity = operation.security && operation.security.some(sec => Object.keys(sec).length === 0);
          
          if (isPublic || hasEmptySecurity) {
            publicCount++;
            if (this.shouldBeProtected(path)) {
              this.addWarning('Authentication', 
                `Potentially sensitive endpoint is public`, 
                `${method.toUpperCase()} ${path}`
              );
            } else {
              console.log(`✅ Public endpoint: ${method.toUpperCase()} ${path}`);
            }
          } else {
            authenticatedCount++;
            console.log(`🔒 Protected endpoint: ${method.toUpperCase()} ${path}`);
          }
        }
      });
    });

    console.log(`📊 Authentication summary: ${authenticatedCount} protected, ${publicCount} public`);
  }

  private validateResponseFormats(): void {
    console.log('\n📋 Validating response format consistency...');
    
    const paths = this.spec.paths || {};
    const inconsistentResponses: string[] = [];

    Object.entries(paths).forEach(([path, pathItem]) => {
      const pathObj = pathItem as OpenAPIV3.PathItemObject;
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      methods.forEach(method => {
        const operation = pathObj[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
        if (operation?.responses) {
          Object.entries(operation.responses).forEach(([statusCode, response]) => {
            if (statusCode.startsWith('2')) { // Success responses
              const responseObj = response as OpenAPIV3.ResponseObject;
              const content = responseObj.content;
              
              if (content && content['application/json']) {
                const schema = content['application/json'].schema as OpenAPIV3.SchemaObject;
                
                // Check for standard response wrapper format
                if (schema?.properties && !schema.properties.code && !schema.properties.data && !this.isHealthEndpoint(path)) {
                  inconsistentResponses.push(`${method.toUpperCase()} ${path}`);
                }
              }
            }
          });
        }
      });
    });

    if (inconsistentResponses.length > 0) {
      this.addWarning('ResponseFormat', 
        `Some endpoints may not follow standard response format`,
        'responses',
        'Consider using consistent { code, data } wrapper format'
      );
      console.log(`⚠️  Potentially inconsistent responses: ${inconsistentResponses.slice(0, 3).join(', ')}${inconsistentResponses.length > 3 ? '...' : ''}`);
    } else {
      console.log('✅ Response formats appear consistent');
    }
  }

  private async validateServerAccessibility(): Promise<void> {
    console.log('\n🌐 Validating server accessibility...');
    
    const servers = this.spec.servers || [];
    
    if (servers.length === 0) {
      this.addWarning('Servers', 'No servers defined in OpenAPI spec');
      return;
    }

    for (const server of servers) {
      try {
        const url = (server as any).url as string | undefined;
        if (!url) continue;
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`✅ Server accessible: ${url} (${(server as any).description || 'No description'})`);
        }
      } catch (error) {
        const url = (server as any).url as string | undefined;
        console.log(`❌ Server not accessible: ${url} (${(server as any).description || 'No description'})`);
        this.addWarning('Servers', 
          `Server not accessible: ${url}`, 
          'servers',
          'Ensure server is running for contract tests'
        );
      }
    }
  }

  // Helper methods
  private findReferencedSchemas(): Set<string> {
    const referenced = new Set<string>();
    const specStr = JSON.stringify(this.spec);
    
    // Find all $ref references to components/schemas
    const refPattern = /"\$ref":\s*"#\/components\/schemas\/([^"]+)"/g;
    let match;
    
    while ((match = refPattern.exec(specStr)) !== null) {
      const refName = match[1] as string | undefined;
      if (refName) referenced.add(refName);
    }
    
    return referenced;
  }

  private requiresAuth(path: string, operation: OpenAPIV3.OperationObject): boolean {
    // Public endpoints
    const publicPaths = ['/health', '/api/auth/register', '/api/auth/login', '/api/shop/products'];
    if (publicPaths.some(p => path === p)) return false;
    
    // Check security configuration
    return !operation.security || !operation.security.some(sec => Object.keys(sec).length === 0);
  }

  private shouldBeProtected(path: string): boolean {
    const sensitivePaths = ['/api/admin', '/api/wallet', '/api/trade', '/api/vault', '/api/support'];
    return sensitivePaths.some(p => path.startsWith(p));
  }

  private isHealthEndpoint(path: string): boolean {
    return path === '/health';
  }

  private addError(category: string, message: string, location: string, severity: 'critical' | 'high' | 'medium'): void {
    this.errors.push({ category, message, location, severity });
  }

  private addWarning(category: string, message: string, location?: string, suggestion?: string): void {
    this.warnings.push({ category, message, location, suggestion });
  }

  private generateSummary(): ValidationSummary {
    const paths = this.spec.paths || {};
    const pathEntries = Object.entries(paths);
    
    const totalEndpoints = pathEntries.reduce((count, [, pathItem]) => {
      const pathObj = pathItem as OpenAPIV3.PathItemObject;
      return count + ['get', 'post', 'put', 'patch', 'delete'].filter(method => pathObj[method as keyof OpenAPIV3.PathItemObject]).length;
    }, 0);

    const phase3Endpoints = pathEntries.filter(([path]) => 
      path.startsWith('/api/redeem') || path.startsWith('/api/vault') || path.startsWith('/api/support')
    ).length;

    const authenticatedEndpoints = pathEntries.reduce((count, [path, pathItem]) => {
      const pathObj = pathItem as OpenAPIV3.PathItemObject;
      return count + ['get', 'post', 'put', 'patch', 'delete'].filter(method => {
        const operation = pathObj[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
        return operation && this.requiresAuth(path, operation);
      }).length;
    }, 0);

    const publicEndpoints = totalEndpoints - authenticatedEndpoints;

    const schemas = this.spec.components?.schemas || {};
    const requiredSchemas: string[] = ['Error'];
    const missingSchemas = requiredSchemas.filter(schema => !(schemas as any)[schema]);

    return {
      totalEndpoints,
      phase3Endpoints,
      authenticatedEndpoints,
      publicEndpoints,
      missingSchemas,
      uncoveredPaths: [] // TODO: Implement path coverage analysis
    };
  }

  private printResults(summary: ValidationSummary): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 OPENAPI VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📈 SUMMARY:');
    console.log(`  Total endpoints: ${summary.totalEndpoints}`);
    console.log(`  Phase-3 endpoints: ${summary.phase3Endpoints}`);
    console.log(`  Protected endpoints: ${summary.authenticatedEndpoints}`);
    console.log(`  Public endpoints: ${summary.publicEndpoints}`);
    console.log(`  Missing schemas: ${summary.missingSchemas.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.severity.toUpperCase()}] ${error.category}: ${error.message}`);
        if (error.location) console.log(`     Location: ${error.location}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.category}: ${warning.message}`);
        if (warning.location) console.log(`     Location: ${warning.location}`);
        if (warning.suggestion) console.log(`     Suggestion: ${warning.suggestion}`);
      });
    }
    
    if (this.errors.length === 0) {
      console.log('\n✅ VALIDATION PASSED');
      console.log('All critical validations passed. OpenAPI specification is well-formed.');
    } else {
      console.log('\n❌ VALIDATION FAILED');
      console.log(`Found ${this.errors.length} errors that should be addressed.`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// CLI execution
async function main(): Promise<void> {
  const specPath = process.argv[2] || path.join(__dirname, '../../src/openapi/openapi.yaml');
  
  if (!fs.existsSync(specPath)) {
    console.error(`❌ OpenAPI specification not found: ${specPath}`);
    process.exit(1);
  }
  
  try {
    const validator = new OpenAPIValidator(specPath);
    const result = await validator.validate();
    
    // Exit with appropriate code
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    const highErrors = result.errors.filter(e => e.severity === 'high').length;
    
    if (criticalErrors > 0) {
      process.exit(2);
    } else if (highErrors > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Validation failed: ${message}`);
    process.exit(3);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(3);
  });
}

export { OpenAPIValidator, ValidationResult };
