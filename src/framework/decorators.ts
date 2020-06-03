import { HTTPMethod } from "fastify";
import { makeDecorator } from "./core";
import { ControllerInst } from "./tokens";

// controller decorator
export function Controller(url: string = "") {
  return makeDecorator(() => ({
    registry: () => ({ url }),
  }));
}

// route decorator
export function Route(method: HTTPMethod, url: string = "") {
  return makeDecorator(({ descriptor }) => ({
    deps: () => [ControllerInst],
    registry: (ctrlInst) => ({
      method,
      url,
      handler: async (req, rep) => {
        return descriptor?.value.apply(ctrlInst, req, rep);
      },
    }),
  }));
}
