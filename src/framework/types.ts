import { RouteOptions } from "fastify";

// bootstrap configuration
export interface BootstrapOptions {
  controllers: Constructable[]; // list of controllers
  providers?: ProvidersConfig[]; // list of providers
  prefix?: string; // prefix the whole urls
  // globalDecorators?: any[]; // global decorators add
}

export type Constructable = { new (...args: any[]) };
export type PartialRouteOptions = Partial<RouteOptions>;

// dependencies
export type DependencyToken = string | symbol;
export type Dependencies = () => any[];
export type FactoryProvider<T> =
  | ((...args: any[]) => T)
  | ((...args: any[]) => Promise<T>);

// factory provider
export type FactoryProviderConfig<T> =
  | {
      deps?: Dependencies;
      factory: FactoryProvider<T>;
    }
  | FactoryProvider<T>;

// boot config, use for custom decorator
export type BootConfig = FactoryProviderConfig<PartialRouteOptions>;

export type ControllerConfigFactory = FactoryProviderConfig<PartialRouteOptions | void>;

// providers
interface ProviderValue {
  token: DependencyToken;
  useValue: any;
}
interface ProviderFactory {
  token: DependencyToken;
  useFactory: FactoryProviderConfig<any>;
}
export type ProvidersConfig = ProviderValue | ProviderFactory | Constructable;

// registry for decorators
export interface RegistryConfigInfo {
  on: "class" | "method" | "property";
  target: any;
  key?: string | symbol;
  descriptor?: PropertyDescriptor;
  type?: any; // design:type
  paramType?: any; // design:paramType
  returnType?: any; // design:returnType
}

export interface RegistryConfig<T = any> {
  on: ("class" | "method" | "property")[]; // default is both
  callback: (info: RegistryConfigInfo) => T;
}

export interface RegistryControllerConfig {
  on: RegistryConfig["on"];
  callback: (
    info: RegistryConfigInfo
  ) => FactoryProviderConfig<PartialRouteOptions | void>;
}

//
// decorators interface
export type RouteExtraOptions = Omit<
  RouteOptions,
  "handler" | "method" | "url"
>;
