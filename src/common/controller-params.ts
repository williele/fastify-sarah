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
    (req) => req.body,
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return { schema: { body: configs } };
      },
    })
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
    (req) => req.params[name],
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        const params = {
          type: "object",
          properties: { [name]: configs },
          required: [name],
        };

        return { schema: { params } };
      },
    })
  );
}

/**
 * parameter decorator, define route multiple param
 * @param type
 * @param schema
 */
export function Params(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    (req) => req.params,
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        const params = {
          ...configs,
          required: Object.keys(configs.properties),
        };

        return { schema: { params } };
      },
    })
  );
}

/**
 * parameter decorator, define route query param
 * @param type
 * @param schema
 */
export function Query(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    (req) => req.query,
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        return { schema: { querystring: configs } };
      },
    })
  );
}

/**
 * parameter decorator, get request header by name
 * @param name header name
 * @param type
 * @param schema
 */
export function Header(name: string, type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    (req) => req.headers[name],
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        const headers = {
          type: "object",
          properties: { [name]: configs },
          required: [name],
        };

        return { schema: { headers } };
      },
    })
  );
}

/**
 * parameter decorator, define route multiple headers
 * @param type
 * @param schema
 */
export function Headers(type?, schema?: TypeAll) {
  return makeControllerParamDecorator(
    (req) => req.headers,
    ({ paramType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        const configs = await parseSchema(type, paramType, schema, container);
        const headers = {
          ...configs,
          required: Object.keys(configs.properties),
        };

        return { schema: { headers } };
      },
    })
  );
}

/**
 * parameter decorator, get request object
 */
export function Req() {
  return makeControllerParamDecorator((req) => req);
}

/**
 * parameter decorator, get reply object
 */
export function Rep() {
  return makeControllerParamDecorator((_req, rep) => rep);
}
