import { HTTPMethod } from "fastify";
import { makeControllerDecorator } from "./controllers";
import { RootInstance } from "dormice";

export function Controller(url: string = "") {
  return makeControllerDecorator({
    on: ["class"],
    callback: () => () => ({ url }),
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
          return descriptor?.value.apply(inst, [req, res]);
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
