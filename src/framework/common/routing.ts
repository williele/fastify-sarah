import { makeDecorator } from "../../public-api";
import { HTTPMethod } from "fastify";
import { RouteExtraOptions } from "../types";
import { ControllerInst } from "../tokens";

// controller decorator
export function Controller(url: string = "") {
  return makeDecorator({
    on: "class",
    callback: () => () => ({ url }),
  });
}

// route decorator
export function Route(
  method: HTTPMethod,
  url: string = "",
  extraOption: RouteExtraOptions = {}
) {
  return makeDecorator({
    on: "method",
    callback: ({ descriptor }) => ({
      deps: () => [ControllerInst],
      factory: (ctrlInst) => ({
        ...extraOption,
        url,
        method,
        handler: async (req, rep) => {
          return descriptor!.value.apply(ctrlInst, [req, rep]);
        },
      }),
    }),
  });
}

// shorthand route decorator
export function Get(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("GET", url, extraOption);
}
export function Head(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("HEAD", url, extraOption);
}
export function Post(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("POST", url, extraOption);
}
export function Put(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("PUT", url, extraOption);
}
export function Delete(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("DELETE", url, extraOption);
}
export function Options(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("OPTIONS", url, extraOption);
}
export function Patch(url: string, extraOption: RouteExtraOptions = {}) {
  return Route("PATCH", url, extraOption);
}
