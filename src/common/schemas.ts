import { makeSchemaDecorator, typeToSchema, mergeSchemaData } from "../schemas";
import { SubData, PreviousData, Result } from "dormice";
import { JSONSchema } from "fastify";

/**
 * schema decorator, use on class
 */
export function Schema() {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [SubData, PreviousData],
      factory: (sub: { [key: string]: JSONSchema[] }, root: JSONSchema[]) => {
        return mergeSchemaData(sub, [{ type: "object" }, ...root]);
      },
    }),
  });
}

/**
 * property decorator, use on property
 */
export function Property() {
  return makeSchemaDecorator({
    on: ["property"],
    callback: ({ type, key }) => ({
      deps: () => [Result],
      factory: (result) => ({
        properties: { [key!]: typeToSchema(type) },
        ...result,
      }),
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
