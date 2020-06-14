import { makeSchemaDecorator, mergeSchemaData, parseSchema } from "../schemas";
import { PreviousData, Result, SubResult, Root, Constructable } from "dormice";
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
      deps: () => [SubResult, PreviousData, Root],
      factory: (
        properties: { [key: string]: JSONSchema },
        root: JSONSchema[],
        target: Constructable
      ) => {
        const obj: any = mergeSchemaData({}, [
          { $id: target.name, type: "object" },
          ...root,
        ]);
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
export function Prop(customType?: any, opts?: TypeAll) {
  return makeSchemaDecorator({
    on: ["property"],
    callback: ({ type }) => ({
      deps: () => [Result],
      factory: async (result) => ({
        ...(await parseSchema(customType, type, opts)),
        ...result,
      }),
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
        if (result === undefined || result.properties === undefined) return {};

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
 * if input fields is empty then required all
 * @param keys list of object fields required
 */
export function Required(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result, SubResult],
      factory: (result, properties) => ({
        ...result,
        required:
          keys.length > 0 ? Array.from(new Set(keys)) : Object.keys(properties),
      }),
    }),
  });
}

/**
 * schema decorator use on object type
 * if input fields is empty then make all properties optional
 * @param keys list of object fields make optional
 */
export function Partial(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => {
        if (result === undefined || result.required === undefined) return {};

        if (keys.length === 0) {
          result.required = [];
        } else {
          const required = new Set(result.required);
          keys.forEach((key) => {
            required.delete(key);
          });
          result.required = Array.from(required);
        }
        return result;
      },
    }),
  });
}

/**
 * select a specific properties inside and object type
 * @param keys list of object fields to pick up
 */
export function Pick(...keys: string[]) {
  return makeSchemaDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Result],
      factory: (result) => {
        if (result === undefined || result.properties === undefined) return {};
        const oldProperties = result.properties;
        const oldRequired = result.required || [];
        const required = new Set();

        result.properties = {};

        keys.forEach((key) => {
          if (oldProperties[key] !== undefined) {
            result.properties[key] = oldProperties[key];
          }
          if (oldRequired.includes(key)) required.add(key);
        });

        result.required = Array.from(required);
        return result;
      },
    }),
  });
}
