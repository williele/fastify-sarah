/// solving core configure
import { Container } from "inversify";
import {
  ProvidersConfig,
  FactoryProviderConfig,
  Constructable,
} from "../types";
import { FastifyInstance, RouteOptions } from "fastify";
import { FastifyInst, ControllerInst } from "../tokens";
import { mergeConfigs } from "./merge-config";
import { getConfig, getRouteConfig } from "./utils";

/**
 * solve factory providers
 */
export async function solveFactoryProvider<T>(
  container: Container,
  factoryConfig: FactoryProviderConfig<T>
): Promise<any> {
  if (typeof factoryConfig === "function") {
    // solve directly with factory
    return factoryConfig();
  } else if (typeof factoryConfig === "object") {
    // solve with dependencies
    const { deps, factory } = factoryConfig;

    const dependencies =
      (deps && deps().map((dep) => container.get(dep))) || [];
    return factory(...dependencies);
  }
}

/**
 * solve list of providers
 */
export async function solveProviders(
  container: Container,
  providers: ProvidersConfig[]
) {
  for (const provider of providers) {
    // class
    if (typeof provider === "function") {
      container.bind(provider).toSelf();
    }

    // value
    else if ("useValue" in provider) {
      container.bind(provider.token).toConstantValue(provider.useValue);
    }

    // factory
    else if ("useFactory" in provider) {
      const value = await solveFactoryProvider(container, provider.useFactory);
      container.bind(provider.token).toConstantValue(value);
    }
  }
}

/**
 * solve a controller configures
 */
export async function solveController(
  container: Container,
  controller: Constructable
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
      const config = ctrlConfigs.concat(routeConfig);
      return mergeConfigs(config);
    }
  );
  const routeConfigs = await Promise.all(routeConfigsPromise);

  // apply fastify route
  routeConfigs.forEach((config) => {
    inst.route(config as RouteOptions);
  });

  return ctrlContainer;
}
