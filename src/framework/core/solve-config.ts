/// solving core configure
import { Container } from "inversify";
import { Constructable, BootstrapOptions, PartialRouteOptions } from "../types";
import { RouteOptions } from "fastify";
import { ControllerInst, BootstrapConfig } from "../tokens";
import { mergeConfigs } from "./merge-config";
import { getConfig, getRouteConfig } from "./utils";
import { solveFactoryProvider } from "./solve-providers";

/**
 * solve root config from bootstrap options
 */
export async function solveRootConfig(opts: BootstrapOptions) {
  const result: PartialRouteOptions = {};

  if (opts.prefix) result.url = opts.prefix;
  return result;
}

/**
 * solve a controller configures
 */
export async function solveControllerConfig(
  container: Container,
  controller: Constructable
): Promise<RouteOptions[]> {
  // get root config
  const rootConfig = container.get<PartialRouteOptions>(BootstrapConfig);

  // make child instance of this controller
  const ctrlInst = container.resolve(controller);
  const ctrlContainer = new Container({ autoBindInjectable: true });
  ctrlContainer.parent = container;

  // add default providers
  ctrlContainer.bind(ControllerInst).toConstantValue(ctrlInst);

  // get all and solve controller config
  const ctrlConfigsPromises = getConfig(controller).map((config) =>
    solveFactoryProvider(ctrlContainer, config)
  );
  const ctrlConfigs = await Promise.all(ctrlConfigsPromises);

  // get all and solve route config
  const routeConfigsRaw = getRouteConfig(controller);
  const routeConfigsPromise = Object.values(routeConfigsRaw).map(
    async (configs) => {
      const routeConfigPromises = configs.map((config) => {
        return solveFactoryProvider(ctrlContainer, config);
      });
      const routeConfig = await Promise.all(routeConfigPromises);
      const config = [rootConfig, ...ctrlConfigs, ...routeConfig];
      return mergeConfigs(config) as RouteOptions;
    }
  );
  const routeConfigs = await Promise.all(routeConfigsPromise);

  // return list of route configs
  return routeConfigs;
}
