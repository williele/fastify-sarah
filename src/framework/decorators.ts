import { HTTPMethod } from "fastify";
import { inject } from "inversify";
import { makeDecorator } from "./core/public-api";
import { ControllerInst } from "./tokens";
import { RouteExtraOptions, Constructable } from "./types";
import { registeInjectable } from "./core/utils";

// injectable decorator
export function Injectable() {
  return (target: Constructable) => {
    return registeInjectable(target);
  };
}
// wrapper to suit with another decorators
export const Inject = inject;

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
