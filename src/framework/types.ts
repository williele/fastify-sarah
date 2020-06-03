import { RouteOptions } from "fastify";

export type Contructable = { new (...args: any[]) };

export interface BootConfig {
  deps: () => any[]; // dependencies token
  registry: (...args: any[]) => Partial<RouteOptions>; // registry function
}

export interface BootstrapOptions {
  prefix?: string; // prefix all controller url
  controllers: Contructable[]; // list of controllers
}
