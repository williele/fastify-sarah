import fp from "fastify-plugin";
import { join } from "path";
import { FastifyInstance, RouteOptions } from "fastify";
import { Container, injectable } from "inversify";
import {
  BootConfig,
  BootstrapOptions,
  Contructable,
  RegistryConfig,
} from "./types";
import { CONTROLLER_BOOT, CONTROLLER_ROUTE_BOOT } from "./metakeys";
import { FastifyInst, ControllerInst, BootstrapOpt } from "./tokens";

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
  const rootContainer = makeRootContainer(inst, opts);

  opts.controllers.forEach((controller) => {
    solveController(rootContainer, controller);
  });
}

/**
 * create default root container
 */
export function makeRootContainer(
  inst: FastifyInstance,
  opts: BootstrapOptions
) {
  const container = new Container({ autoBindInjectable: true });

  // core providers
  container.bind(FastifyInst).toConstantValue(inst);
  container.bind(BootstrapOpt).toConstantValue(opts);

  // provide option providers
  // TODO: resolve async provider

  return container;
}

/**
 * solve dependencies from config
 */
export function solveBootConfig(
  container: Container,
  config: BootConfig
): Partial<RouteOptions> {
  const deps =
    (config.deps && config.deps().map((dep) => container.get(dep))) || [];
  return config.registry(...deps);
}

/**
 * solve a controller configures
 */
export async function solveController(
  container: Container,
  controller: Contructable
): Promise<Container> {
  // get fastify instance
  const inst = container.get<FastifyInstance>(FastifyInst);

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
  const routeConfigsRaw = getRouteConfig(controller);
  const routeConfigs = Object.values(routeConfigsRaw).map((configs) => {
    const routeConfig = configs.map((config) => {
      return solveBootConfig(ctrlContainer, config);
    });
    const config = ctrlConfigs.concat(routeConfig);
    return mergeConfigs(config);
  });

  // apply fastify route
  routeConfigs.forEach((config) => {
    inst.route(config as RouteOptions);
  });

  return ctrlContainer;
}

const DEFAULT_CONFIG: Partial<RouteOptions> = {
  url: "/",
};

/**
 * merge configures
 */
export function mergeConfigs(configs: Partial<RouteOptions>[]) {
  return configs.reduce((a, b) => combineConfigs({ ...a }, { ...b }), {
    ...DEFAULT_CONFIG,
  });
}

const STACK_PROPERTIES = [
  "onRequest",
  "preParsing",
  "preValidation",
  "preHandler",
  "preSerialization",
  "onSend",
  "onResponse",
];

// combine two config
function combineConfigs(
  a: Partial<RouteOptions>,
  b: Partial<RouteOptions>
): Partial<RouteOptions> {
  const result = a;

  Object.entries(b).forEach(([key, val]) => {
    if (!result[key]) return (result[key] = val);
    // join path
    if (key === "url") return (result[key] = join(result[key]!, val));
    // merge schema
    if (key === "schema")
      return (result[key] = combineObjects(result[key]!, val));
    // stack
    if (STACK_PROPERTIES.includes(key)) {
      if (Array.isArray(result[key])) result[key] = result[key].concat(val);
      else result[key] = [result[key], val];
      return;
    }
    // replace
    result[key] = val;
  });

  return result;
}

// combine two object
function combineObjects(a: object, b: object) {
  const result = a;
  Object.entries(b).forEach(([key, val]) => {
    if (!result[key]) return (result[key] = val);
    // merge array
    if (Array.isArray(result[key]))
      return (result[key] = result[key].concat(val));
    // merge object
    if (typeof result[key] === "object" && typeof val === "object")
      return (result[key] = combineObjects(result[key], val));

    result[key] = val;
  });

  return result;
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
