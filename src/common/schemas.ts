import { makeSchemaDecorator, mergeSchemaData } from "../schemas";
import { PreviousData, Result, SubResult } from "dormice";
import { JSONSchema } from "fastify";
import {
  StringTypeOptions,
  NumTypeOptions,
  BoolTypeOptions,
  ArrayTypeOptions,
  TypeAll,
  ObjectTypeOptions,
} from "../types";
import { ProcessSchema } from "../tokens";

/**
 * schema decorator, use on class
 */
export function ObjectType(opts: ObjectTypeOptions = {}) {
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
        return { ...obj, ...opts };
      },
    }),
  });
}

/**
 * schema decorator, use on top of property decorators
 * @param opts array options
 */
export function ArrayProp(opts: ArrayTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => ({ type: "array", ...opts, items: result }),
    }),
  });
}

/**
 * schema decorator, use on property
 * @param type function that return a ObjectType
 */
export function ObjectProp(type: () => any) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => ({
      deps: () => [ProcessSchema],
      factory: async (processSchema) => {
        const configs = await processSchema(type());
        return configs.result;
      },
    }),
  });
}

/**
 * property decorator, use on property
 */
export function Prop(opts: TypeAll) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => ({ ...result, ...opts }),
    }),
  });
}

/**
 * string decorator, use on schema property
 * @param opts string type options
 */
export function StringProp(opts: StringTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "string", ...opts }),
  });
}

/**
 * number decorator, use on schema property
 * @param opts number type options
 */
export function NumProp(opts: NumTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "number", ...opts }),
  });
}

/**
 * integer decorator, use on schema property
 * @param opts integer type options
 */
export function IntProp(opts: NumTypeOptions = {}) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: () => () => ({ type: "integer", ...opts }),
  });
}

/**
 * boolean decorator, use on schema property
 * @param opts boolean type options
 */
export function BoolProp(opts: BoolTypeOptions = {}) {
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
