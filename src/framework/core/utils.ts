import { BootConfig, RegistryConfig } from "../types";
import { CONTROLLER_BOOT, CONTROLLER_ROUTE_BOOT } from "../metakeys";
import { injectable } from "inversify";

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
  registers[key] = registers[key] || [];
  registers[key].push(config);
  Reflect.defineMetadata(CONTROLLER_ROUTE_BOOT, registers, target);
}

/**
 * create class or method decorator for override config
 */
export function makeDecorator(registry: RegistryConfig) {
  return (target, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    const config = registry({ target, key, descriptor });

    if (key !== undefined) {
      registeRouteConfig(target.constructor, key, config);
    } else {
      registeConfig(target, config);
      return injectable()(target);
    }
  };
}
