import { injectable } from "inversify";
import { BootConfig, RegistryConfig } from "../types";
import {
  CONTROLLER_BOOT,
  CONTROLLER_ROUTE_BOOT,
  CLASS_INJECTABLE,
} from "../metakeys";

export function getConfig(target): BootConfig[] {
  return Reflect.getOwnMetadata(CONTROLLER_BOOT, target) || [];
}

export function getRouteConfig(target): { [key: string]: BootConfig[] } {
  return Reflect.getOwnMetadata(CONTROLLER_ROUTE_BOOT, target) || {};
}

/**
 * controller config registry
 * use for override all router config
 */
export function registeConfig(target, config: BootConfig) {
  const registers = Reflect.getOwnMetadata(CONTROLLER_BOOT, target) || [];
  // configure should freeze
  Object.freeze(config);

  registers.push(config);
  Reflect.defineMetadata(CONTROLLER_BOOT, registers, target);
}

/**
 * route config registry
 * use for override key route config
 */
export function registeRouteConfig(
  target,
  key: string | symbol,
  config: BootConfig
) {
  const registers = Reflect.getOwnMetadata(CONTROLLER_ROUTE_BOOT, target) || {};
  // configure should freeze
  Object.freeze(config);

  registers[key] = registers[key] || [];
  registers[key].push(config);

  Reflect.defineMetadata(CONTROLLER_ROUTE_BOOT, registers, target);
}

/**
 * registe injectable for class if not already
 */
export function registeInjectable(target) {
  const isInjectable =
    Reflect.getOwnMetadata(CLASS_INJECTABLE, target) || false;
  if (isInjectable) {
    return target;
  } else {
    Reflect.defineMetadata(CLASS_INJECTABLE, true, target);
    return injectable()(target);
  }
}

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
