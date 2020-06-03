import fp from "fastify-plugin";
import {
  BootConfig,
  BootstrapOptions,
  Contructable,
  RegistryConfig,
} from "./types";
import { CONTROLLER_BOOT, CONTROLLER_ROUTE_BOOT } from "./metakeys";
import { FastifyInstance, RouteOptions, RegisterOptions } from "fastify";
import { Container, injectable } from "inversify";
import { FastifyInst, ControllerInst } from "./tokens";

/**
 * bootstrap
 */
export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  await boot(inst, opts);
  done();
});

/**
 * solve dependencies from config
 */
export function solveBootConfig(
  container: Container,
  config: BootConfig
): Partial<RouteOptions> {
  const deps = config.deps().map((dep) => container.get(dep));
  return config.registry(...deps);
}

// compile
export async function boot(inst: FastifyInstance, opts: BootstrapOptions) {
  // create a root container
  const rootContainer = new Container({ autoBindInjectable: true });

  // add default root providers
  rootContainer.bind(FastifyInst).toConstantValue(inst);

  // provide option providers
  // TODO: resolve async provider

  opts.controllers.forEach((controller) => {
    solveContorller(rootContainer, controller);
  });
}

/**
 * solve a controller configures
 */
export async function solveContorller(
  container: Container,
  controller: Contructable
): Promise<Container> {
  // make child instance of this controller
  const ctrlInst = container.resolve(controller);
  const ctrlContainer = new Container({ autoBindInjectable: true });
  ctrlContainer.parent = container;

  // add default providers
  ctrlContainer.bind(ControllerInst).toConstantValue(ctrlInst);

  // get all and solve controller config
  const ctrlConfigs = getConfig(controller).map((config) =>
    solveBootConfig(ctrlContainer, config)
  );

  // get all and solve route config
  const routeConfigs = Object.values(
    getRouteConfig(controller)
  ).map((configs) =>
    ctrlConfigs.concat(
      configs.map((config) => solveBootConfig(ctrlContainer, config))
    )
  );

  // apply fastify route
  routeConfigs.forEach((config) => {
    console.log(config);
  });

  return ctrlContainer;
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
