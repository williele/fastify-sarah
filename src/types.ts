import { RouteOptions } from "fastify";
import { Providers, Constructable } from "dormice";

export type ControllerConfig = Partial<RouteOptions>;

export interface BootstrapOptions {
  controllers: Constructable[]; // controllers
  providers?: Providers;
  prefix?: string; // prefix all route url
}
