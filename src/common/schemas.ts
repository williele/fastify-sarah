import { makeSchemaDecorator, typeToSchema, mergeSchemaData } from "../schemas";
import { PreviousData, Result, SubResult } from "dormice";
import { JSONSchema } from "fastify";
import { combineObjects } from "../utils/merge-config";

/**
 * schema decorator, use on class
 */
export function ObjectType() {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [SubResult, PreviousData],
      factory: (
        subResult: { [key: string]: JSONSchema },
        root: JSONSchema[]
      ) => {
        return mergeSchemaData(subResult, [{ type: "object" }, ...root]);
      },
    }),
  });
}

/**
 * property decorator, use on property
 */
export function Prop(customType?: () => any) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: ({ type, key }) => ({
      deps: () => [Result],
      factory: (result) => {
        return combineObjects(result || {}, {
          properties: { [key!]: typeToSchema(type, customType) },
        });
      },
    }),
  });
}

export function RawProp(schema: JSONSchema) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: ({ key }) => ({
      deps: () => [Result],
      factory: (result) => {
        return combineObjects(result || {}, {
          properties: { [key!]: schema },
        });
      },
    }),
  });
}

/**
 * exclude exists properties in JSON schema object
 * NOTE: use after (on top) of @Schema decorator
 * @param keys required if use on class decorator
 */
export function Exclude(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => {
        if (result === undefined || result.properties === undefined)
          throw new Error(`@Exclude much use behind @Schema`);

        keys.forEach((key) => {
          delete result.properties[key];
        });

        return result;
      },
    }),
  });
}

// export function Required(...keys: string[]) {}

// export function Partial(...keys: string[]) {}
