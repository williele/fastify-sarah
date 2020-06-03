import { RouteOptions } from "fastify";

// registry controller metadata
export function controller(target) {}

export interface ConfigRegistry {
  deps: () => any[]; // dependencies token
  registry: () => Partial<RouteOptions>; // registry function
}
/**
 * controller config registry
 * use for override all router config
 */
export function registeConfig(target, registry: ConfigRegistry) {}

/**
 * route config registry
 * use for override key route config
 */
export function registeRouteConfig(target, key, registry: ConfigRegistry) {}

// method decorator support
export interface MethodDecoratorArgs {
  target: any;
  key: string | symbol;
  descriptor: PropertyDescriptor;
}

export function methodDecorator(registry: ConfigRegistry) {
  return function (
    target,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) {};
}
