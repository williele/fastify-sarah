import { Container } from "inversify";
import { FactoryProviderConfig, ProvidersConfig } from "../types";

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
