import {
  DecoratorConfig,
  makeDecorator,
  Constructable,
  processDecorators,
  Container,
  DecoratorData,
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
  sub: { [key: string]: JSONSchema[] },
  root: JSONSchema[]
) {
  const properties: JSONSchema = {};

  Object.entries(sub).forEach(([key, configs]) => {
    const schema = configs.reduce((a, b) => combineObjects(a, b), {});
    properties[key] = schema;
  });

  return root.concat({ properties }).reduce((a, b) => combineObjects(a, b), {});
}

/**
 * turn javascript to JSON schema
 * @param type javscript type
 */
export function typeToSchema(type: any) {
  switch (type) {
    case String:
      return { type: "string" };
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
