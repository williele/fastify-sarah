import {
  HTTPMethod,
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { ServerResponse } from "http";
import { makeControllerDecorator, mergeControllerData } from "../controllers";
import { RootInstance, SubData, PreviousData } from "dormice";
import { Fastify } from "../tokens";
import { ControllerConfig } from "../types";

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
        routes.forEach((route) => fastify.route(route));

        return { url };
      },
    }),
  });
}

export function Route(method: HTTPMethod, url: string = "") {
  return makeControllerDecorator({
    on: ["method"],
    callback: ({ descriptor }) => ({
      deps: () => [RootInstance],
      factory: (inst) => ({
        method,
        url,
        handler: async (req, res) => {
          const payload = await descriptor?.value.apply(inst, [req, res]);
          if (payload === undefined) res.send();
          return payload;
        },
      }),
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
