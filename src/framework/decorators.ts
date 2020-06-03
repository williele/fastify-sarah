import { HTTPMethod } from "fastify";
import { makeDecorator } from "./core";

// controller decorator
export function Controller(url: string = "") {
  return makeDecorator({
    deps: () => [],
    registry: () => ({ url }),
  });
}

// route decorator
export function Route(method: HTTPMethod, url: string = "") {
  return makeDecorator({
    deps: () => [],
    registry: () => ({ method, url }),
  });
}
