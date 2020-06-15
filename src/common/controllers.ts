import {
  HTTPMethod,
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { ServerResponse } from "http";
import { makeControllerDecorator, mergeControllerData } from "../controllers";
import { RootInstance, SubData, PreviousData, ParentContainer } from "dormice";
import { Fastify, BootstrapConfig } from "../tokens";
import { ControllerConfig, TypeAll, BootstrapOptions } from "../types";
import { parseSchema, addSchemaFromRoute } from "../schemas";
import { CONTROLLER_PARAM } from "../metadatakeys";

/**
 * controller decorator, use on a class
 * @param url route url
 */
export function Controller(url: string = "") {
  return makeControllerDecorator({
    on: "class",
    callback: () => ({
      deps: () => [Fastify, SubData, PreviousData, BootstrapConfig],
      factory: (
        fastify: FastifyInstance,
        sub: { [key: string]: ControllerConfig[] },
        root: ControllerConfig[],
        bootOpts: BootstrapOptions
      ) => {
        const bootConfig: ControllerConfig = {};
        if (bootOpts.prefix !== undefined) bootConfig.url = bootOpts.prefix;

        const routes = mergeControllerData(sub, [bootConfig, { url }, ...root]);
        routes.forEach((route) => {
          // adding schema
          if (bootOpts.addSchema) {
            addSchemaFromRoute(fastify, route);
          }

          // apply route
          if (
            route.method !== undefined &&
            route.url !== undefined &&
            route.handler !== undefined
          ) {
            fastify.route(route);
          }
        });

        return { url };
      },
    }),
  });
}

export function Route(method: HTTPMethod, url: string = "") {
  return makeControllerDecorator({
    on: "method",
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

/**
 * custom response type schema
 * @param statusCode http status code
 * @param type addition define type, this required if response type is array
 * @param schema addition schema
 */
export function Res(
  type?: any,
  statusCode: string | number = "2xx",
  schema?: TypeAll
) {
  return makeControllerDecorator({
    on: "method",
    callback: ({ returnType }) => ({
      deps: () => [ParentContainer],
      factory: async (container) => {
        // if return type and custom type both undefine
        if (returnType === undefined && type === undefined) return {};
        const responseSchema = await parseSchema(
          type,
          returnType,
          schema,
          container
        );

        return { schema: { response: { [statusCode]: responseSchema } } };
      },
    }),
  });
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
