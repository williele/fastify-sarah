import { RegistryConfig } from "../types";
import { registeRouteConfig, registeConfig, registeInjectable } from "./utils";

/**
 * create class or method decorator for override config
 */
export function makeDecorator(registry: RegistryConfig) {
  return (target, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    // method decorator
    if (
      key !== undefined &&
      (registry.on === "method" || registry.on === "both")
    ) {
      const config = registry.callback({
        on: "method",
        target,
        key,
        descriptor,
      });

      if (config) registeRouteConfig(target.constructor, key!, config as any);
      return;
    }

    // class decorator
    if (registry.on === "class" || registry.on === "both") {
      const config = registry.callback({ on: "class", target });

      if (config) registeConfig(target, config as any);
      // make controller injectable if not yet
      return registeInjectable(target);
    }
  };
}
