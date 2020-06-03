import fp from "fastify-plugin";
import { BootConfig, BootstrapOptions } from "./types";
import { CONTROLLER_BOOT, CONTROLLER_ROUTE_BOOT } from "./metakeys";
import { FastifyInstance } from "fastify";

/**
 * bootstrap
 */
export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  await boot(inst, opts);
  done();
});

// compile
export async function boot(inst: FastifyInstance, opts: BootstrapOptions) {
  // create a root container

  // add default root providers

  // provide option providers
  // TODO: resolve async provider

  opts.controllers.forEach((controller) => {
    // make child instance of this controller

    // add default providers

    // get all controller config
    console.log(getConfig(controller));
    // solve controller config

    // get all routes config
    // solve route config

    // modify some config

    // apply fastify route
  });
}

function getConfig(target): BootConfig[] {
  return Reflect.getOwnMetadata(CONTROLLER_BOOT, target) || [];
}

function getRouteConfig(target): { [key: string]: BootConfig[] } {
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
export function makeDecorator(config: BootConfig) {
  return (target, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (key !== undefined) registeRouteConfig(target.constructor, key, config);
    else registeConfig(target, config);
  };
}
