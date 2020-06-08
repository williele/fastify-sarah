import { makeSchemaDecorator, typeToSchema, mergeSchemaData } from "../schemas";
import { SubData, PreviousData } from "dormice";
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
    callback: ({ type }) => ({
      deps: () => [],
      factory: () => typeToSchema(type),
    }),
  });
}
