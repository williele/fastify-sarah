import {
  RegistryConfig,
  RegistryConfigInfo,
  RegistryControllerConfig,
  FactoryProviderConfig,
} from "../types";
import {
  registeCtrlMethodFactories,
  registeCtrlClassFactories,
  registeInjectable,
} from "./register";

/**
 * create class or method decorator for override config
 */
export function makeDecorator(
  registry: RegistryConfig,
  callback: (
    info: RegistryConfigInfo,
    config: FactoryProviderConfig<any>
  ) => void
) {
  return (target, key?: string, descriptor?: PropertyDescriptor) => {
    // method decorator
    if (
      descriptor !== undefined &&
      (registry.on.includes("method") || registry.on.includes("all"))
    ) {
      const info: RegistryConfigInfo = {
        on: "method",
        target,
        key,
        descriptor,
      };
      const config = registry.callback(info);
      return callback(info, config as any);
    }

    // properties decorator
    if (
      key !== undefined &&
      (registry.on.includes("properties") || registry.on.includes("all"))
    ) {
      const info: RegistryConfigInfo = { on: "properties", target, key };
      const config = registry.callback(info);
      return callback(info, config);
    }

    // class decorator
    if (registry.on.includes("class") || registry.on.includes("all")) {
      const info: RegistryConfigInfo = { on: "class", target };
      const config = registry.callback(info);
      return callback(info, config);
    }
  };
}

/**
 * make controller decorators
 */
export function makeControllerDecorator(registry: RegistryControllerConfig) {
  return makeDecorator(registry, ({ on, target, key }, config) => {
    if (on === "method") {
      if (config)
        registeCtrlMethodFactories(target.constructor, key as string, config);
    } else if (on === "class") {
      if (config) registeCtrlClassFactories(target, config);
      return registeInjectable(target);
    }
  });
}

/**
 * make schema decorators
 */
export function makeSchemaDecorator(registry: RegistryConfig) {
  return makeDecorator(registry, ({}, config) => {
    //
  });
}
