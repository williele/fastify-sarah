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
