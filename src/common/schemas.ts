import { makeSchemaDecorator, typeToSchema, mergeSchemaData } from "../schemas";
import { PreviousData, Result, SubResult } from "dormice";
import { JSONSchema } from "fastify";
import { combineObjects } from "../utils/merge-config";
import {
  StringTypeOptions,
  NumTypeOptions,
  BoolTypeOptions,
  ArrayTypeOptions,
} from "../types";

/**
 * schema decorator, use on class
 */
export function ObjectType() {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [SubResult, PreviousData],
      factory: (
        properties: { [key: string]: JSONSchema },
        root: JSONSchema[]
      ) => {
        const obj: any = mergeSchemaData({}, [{ type: "object" }, ...root]);
        obj.properties = properties;
        return obj;
      },
    }),
  });
}

/**
 * schema decorator, use on top of property decorators
 */
export function ArrayType(opts: ArrayTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => ({ type: "array", ...opts, items: result }),
    }),
  });
}

/**
 * property decorator, use on property
 */
export function Prop(customType?: () => any) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: ({ type }) => ({
      deps: () => [Result],
      factory: (result) => {
        return combineObjects(typeToSchema(type, customType), result || {});
      },
    }),
  });
}

/**
 * string decorator, use on schema property
 * @param opts string type options
 */
export function StringType(opts: StringTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "string", ...opts }),
  });
}

/**
 * number decorator, use on schema property
 * @param opts number type options
 */
export function NumType(opts: NumTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "number", ...opts }),
  });
}

/**
 * integer decorator, use on schema property
 * @param opts integer type options
 */
export function IntType(opts: NumTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "integer", ...opts }),
  });
}

/**
 * boolean decorator, use on schema property
 * @param opts boolean type options
 */
export function BoolType(opts: BoolTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "boolean", ...opts }),
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
        if (result === undefined || result.properties === undefined) {
          return result;
        }

        const required = new Set(result.required);

        keys.forEach((key) => {
          delete result.properties[key];
          // remove from required list
          required.delete(key);
        });

        if (result.required) result.required = Array.from(required);
        return result;
      },
    }),
  });
}

/**
 * schema decorator use on object type
 * @param keys list of object fields required
 */
export function Required(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => ({ ...result, required: Array.from(new Set(keys)) }),
    }),
  });
}

export function Partial(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => {
        if (result === undefined && result.required === undefined)
          return result;

        const required = new Set(result.required);
        keys.forEach((key) => {
          required.delete(key);
        });
        result.required = required;
        return result;
      },
    }),
  });
}

export function PartialAll() {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => ({ ...result, required: [] }),
    }),
  });
}
