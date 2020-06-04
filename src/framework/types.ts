import { RouteOptions } from "fastify";

// bootstrap configuration
export interface BootstrapOptions {
  controllers: Constructable[]; // list of controllers
  providers?: ProvidersConfig[]; // list of providers
  // prefix?: string; // prefix the whole urls
  // globalDecorators?: any[]; // global decorators add
}

export type Constructable = { new (...args: any[]) };

// dependencies
export type DependencyToken = string | symbol;
export type Dependencies = () => any[];
export type FactoryProvider<T> =
  | ((...args: any[]) => T)
  | ((...args: any[]) => Promise<T>);

export type FactoryProviderConfig<T> =
  | {
      deps?: Dependencies;
      factory: FactoryProvider<T>;
    }
  | FactoryProvider<T>;

// boot config, use for custom decorator
export type BootConfig = FactoryProviderConfig<Partial<RouteOptions>>;

interface ProviderValue {
  token: DependencyToken;
  useValue: any;
}
interface ProviderFactory {
  token: DependencyToken;
  useFactory: FactoryProviderConfig<any>;
}
interface ProviderLazy {
  token: DependencyToken;
  useLazy: {
    deps?: Dependencies;
    factory: (...args: any[]) => any;
  };
}
export type ProvidersConfig =
  | ProviderValue
  | ProviderFactory
  | ProviderLazy
  | Constructable;

// registry for decorators
export interface RegistryConfig {
  on: "class" | "method" | "both"; // default is both
  callback: (info: {
    on: "class" | "method";
    target: any;
    key?: string | symbol;
    descriptor?: PropertyDescriptor;
  }) => FactoryProviderConfig<Partial<RouteOptions> | void>;
}

//
// decorators interface
export type RouteExtraOptions = Omit<
  RouteOptions,
  "handler" | "method" | "url"
>;
