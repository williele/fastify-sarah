import {
  DecoratorConfig,
  makeDecorator,
  Constructable,
  processDecorators,
  Container,
  createContainer,
  ParentContainer,
} from "dormice";
import { SCHEMA_ROOT, SCHEMA_SUB } from "./metadatakeys";
import { JSONSchema, FastifyInstance, RouteOptions } from "fastify";
import { combineObjects } from "./utils/merge-config";
import { ProcessSchema } from "./tokens";
import { TypeAll, BootstrapOptions } from "./types";

/**
 * make custom schema decorator
 * @param config decorator config
 */
export function makeSchemaDecorator(config: DecoratorConfig<any>) {
  return makeDecorator(config, {
    rootMetadata: SCHEMA_ROOT,
    subMetadata: SCHEMA_SUB,
  });
}

/**
 * helper function to merge schema data
 */
export function mergeSchemaData(
  sub: { [key: string]: JSONSchema },
  root: JSONSchema[]
) {
  const subs = Object.values(sub);

  return root.concat(subs).reduce((a, b) => combineObjects(a, b), {});
}

export async function parseSchema(
  type,
  secondaryType?,
  schema?: TypeAll,
  container?: Container
) {
  const actualType = type || secondaryType;
  if (Array.isArray(actualType)) {
    const items = await Promise.all(actualType.map((t) => parseSchema(t)));
    return {
      type: "array",
      items: items.length === 1 ? items[0] : items,
      ...schema,
    };
  }

  switch (actualType) {
    case String:
      return { type: "string", ...schema };
    case Number:
      return { type: "number", ...schema };
    case Boolean:
      return { type: "boolean", ...schema };
    default:
      const obj = await processSchema(actualType, container);
      if (obj) return { ...(obj.result as object), ...schema };
      else return schema;
  }
}

/**
 * process schema from decorators
 * @param target schema class
 * @param container optional parent container
 */
export async function processSchema(
  target: Constructable,
  container?: Container
) {
  const processContainer = await createContainer(
    [
      {
        token: ProcessSchema,
        useFactory: {
          deps: () => [ParentContainer],
          factory: (parentContainer) => (target) =>
            processSchema(target, parentContainer),
        },
      },
    ],
    container
  );

  return processDecorators(
    target,
    { rootMetadata: SCHEMA_ROOT, subMetadata: SCHEMA_SUB },
    processContainer
  );
}

/**
 * add a schema if not yet added to fastify instance
 * @param inst fastify instance
 * @param schema schema
 */
export function addSchema(inst: FastifyInstance, schema: any) {
  if (schema.$id === undefined) return;

  const schemas = inst.getSchemas();
  if (schemas[schema.$id] !== undefined) return;
  inst.addSchema(schema);
}

/**
 * add schema body, params, querystring, reponse and headers into fastify shared schemas
 * @param inst fastify instance
 * @param routeOpts route options
 */
export function addSchemaFromRoute(
  inst: FastifyInstance,
  routeOpts: Partial<RouteOptions>
) {
  const schema = routeOpts.schema;
  if (!schema) return;

  const { body, querystring, params, response, headers } = schema;
  // body
  if (body && (body as any).$id) addSchema(inst, body);
  // query
  if (querystring && (querystring as any).$id) addSchema(inst, querystring);
  // params
  if (params && (params as any).$id) addSchema(inst, params);
  // reponse
  if (response) {
    Object.values(response).forEach((schema) => {
      if (schema && (schema as any).$id) addSchema(inst, schema);
    });
  }
  // headers
  if (headers) {
    Object.values(headers).forEach((schema) => {
      if (schema && (schema as any).$id) addSchema(inst, schema);
    });
  }
}
