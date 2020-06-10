import {
  HTTPMethod,
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { ServerResponse } from "http";
import {
  makeControllerDecorator,
  mergeControllerData,
  makeControllerParamDecorator,
} from "../controllers";
import { RootInstance, SubData, PreviousData, ParentContainer } from "dormice";
import { Fastify } from "../tokens";
import { ControllerConfig, TypeAll } from "../types";
import { parseSchema } from "../schemas";
import { CONTROLLER_PARAM } from "../metadatakeys";

export function Controller(url: string = "") {
  return makeControllerDecorator({
    on: ["class"],
    callback: () => ({
      deps: () => [Fastify, SubData, PreviousData],
      factory: (
        fastify: FastifyInstance,
        sub: { [key: string]: ControllerConfig[] },
        root: ControllerConfig[]
      ) => {
        const routes = mergeControllerData(sub, [{ url }, ...root]);
        routes.forEach((route) => {
          // apply route
          fastify.route(route);
        });

        return { url };
      },
    }),
  });
}

export function Route(method: HTTPMethod, url: string = "") {
  return makeControllerDecorator({
    on: ["method"],
    callback: ({ target, key, descriptor }) => ({
      deps: () => [RootInstance],
      factory: (inst) => {
        const decorators: ((
          req: FastifyRequest,
          rep: FastifyReply<any>
        ) => void)[] = Reflect.getOwnMetadata(
          CONTROLLER_PARAM,
          target.constructor,
          key!
        );

        return {
          method,
          url,
          handler: async (req, res) => {
            const args = decorators
              ? decorators.map((decorator) => decorator(req, res))
              : [req, res];

            const payload = await descriptor?.value.apply(inst, args);
            if (payload === undefined) res.send();
            return payload;
          },
        };
      },
    }),
  });
}

// shorthand route
export const Get = (url: string = "") => Route("GET", url);
export const Head = (url: string = "") => Route("HEAD", url);
export const Options = (url: string = "") => Route("OPTIONS", url);
export const Post = (url: string = "") => Route("POST", url);
export const Put = (url: string = "") => Route("PUT", url);
export const Patch = (url: string = "") => Route("PATCH", url);
export const Delete = (url: string = "") => Route("DELETE", url);

// parameter decorators
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
          schema: {
            querystring: {
              ...configs,
              required: Object.keys(configs.properties),
            },
          },
        };
      },
    }),
    (req) => req.query
  );
}

/**
 * auth transform reponse common status codes
 * POST: 202
 * Another: 200 (not empty), 204 (empty)
 */
export function CommonStatus() {
  return makeControllerDecorator({
    on: ["method", "class"],
    callback: () => () => ({
      onSend: async (
        req: FastifyRequest,
        rep: FastifyReply<ServerResponse>,
        payload: any
      ) => {
        if (rep.res.statusCode >= 300) return;

        switch (req.raw.method) {
          case "POST":
            rep.code(202);
            return;
          default:
            if (payload === undefined) {
              rep.code(204);
              return;
            } else return;
        }
      },
    }),
  });
}
