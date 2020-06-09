import {
  DecoratorConfig,
  makeDecorator,
  Constructable,
  processDecorators,
  Container,
} from "dormice";
import { SCHEMA_ROOT, SCHEMA_SUB } from "./metadatakeys";
import { JSONSchema } from "fastify";
import { combineObjects } from "./utils/merge-config";

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

/**
 * turn javascript to JSON schema
 * @param type javscript type
 */
export function typeToSchema(type: any, customType?: () => any) {
  // if type if array
  if (type === Array) {
    if (customType === undefined) {
      throw new Error(`for array property you need to specify items type`);
    }

    return { type: "array", items: typeToSchema(customType()) };
  }

  // use custom type if exists
  switch (customType ? customType() : type) {
    case String:
      return { type: "string" };
    case Date:
      return { type: "string", format: "date" };
    case Number:
      return { type: "number" };
    case Boolean:
      return { type: "boolean" };
    default:
      return {};
  }
}

/**
 * process schema from decorators
 * @param target schema class
 * @param container optional parent container
 */
export function processSchema(target: Constructable, container?: Container) {
  return processDecorators(
    target,
    { rootMetadata: SCHEMA_ROOT, subMetadata: SCHEMA_SUB },
    container
  );
}
