import { TypeAll } from "../types";
import { makeControllerParamDecorator } from "../controllers";
import { ParentContainer } from "dormice";
import { parseSchema } from "../schemas";

/**
 * parameter decorator, define route body
 * @param type
 * @param schema
 */
export function Body(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return { schema: { body: configs } };
      },
    }),
    (req) => req.body
  );
}

/**
 * parameter decorator, define route single param
 * @param name
 * @param type
 * @param schema
 */
export function Param(name: string, type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return {
          schema: {
            params: {
              type: "object",
              properties: { [name]: configs },
              required: [name],
            },
          },
        };
      },
    }),
    (req) => req.params[name]
  );
}

/**
 * parameter decorator, define route multiple param
 * @param name
 * @param type
 * @param schema
 */
export function Params(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return {
          schema: {
            params: { ...configs, required: Object.keys(configs.properties) },
          },
        };
      },
    }),
    (req) => req.params
  );
}

/**
 * parameter decorator, define route query param
 * @param type
 * @param schema
 */
export function Query(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return {
          schema: { querystring: configs },
        };
      },
    }),
    (req) => req.query
  );
}
