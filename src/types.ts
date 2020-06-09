import { RouteOptions } from "fastify";
import { Providers, Constructable } from "dormice";

export type ControllerConfig = Partial<RouteOptions>;

export interface BootstrapOptions {
  controllers: Constructable[]; // controllers
  providers?: Providers;
  prefix?: string; // prefix all route url
}

export interface TypeOptions {
  type?: string;
  [key: string]: any;
}

export type ArrayTypeOptions = Omit<TypeOptions, "type"> & {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
};

export type StringTypeOptions = Omit<TypeOptions, "type"> & {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  formatMaximum?: string;
  formatMinimum?: string;
  formatExclusiveMaximum?: boolean;
  formatExclusiveMinimum?: boolean;
  default?: string;
};

export type NumTypeOptions = Omit<TypeOptions, "type"> & {
  maximum?: number;
  minimum?: number;
  exclusiveMaximum?: boolean;
  exclusiveMinimum?: boolean;
  multipleOf?: number;
  default?: number;
};

export type BoolTypeOptions = Omit<TypeOptions, "type"> & {
  default?: boolean;
};
