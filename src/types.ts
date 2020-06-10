import { RouteOptions, JSONSchema } from "fastify";
import { Providers, Constructable } from "dormice";

export type ControllerConfig = Partial<RouteOptions>;

export interface BootstrapOptions {
  controllers: Constructable[]; // controllers
  providers?: Providers;
  prefix?: string; // prefix all route url
}

export interface DataReference {
  $data: string;
}

export interface TypeOptions {
  type?: string;
  [key: string]: any;
}

export type ObjectTypeOptions = Omit<TypeOptions, "type"> & {
  minProperties?: number;
  maxProperties?: number;
  required?: string[];
  properties?: JSONSchema;
  patternProperties?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  dependencies?: JSONSchema;
};

export type ArrayTypeOptions = Omit<TypeOptions, "type"> & {
  minItems?: number | DataReference;
  maxItems?: number | DataReference;
  uniqueItems?: boolean | DataReference;
};

export type StringTypeOptions = Omit<TypeOptions, "type"> & {
  minLength?: number | DataReference;
  maxLength?: number | DataReference;
  pattern?: string | DataReference;
  format?: string | DataReference;
  formatMaximum?: string | DataReference;
  formatMinimum?: string | DataReference;
  formatExclusiveMaximum?: boolean | DataReference;
  formatExclusiveMinimum?: boolean | DataReference;
  default?: string | DataReference;
};

export type NumTypeOptions = Omit<TypeOptions, "type"> & {
  maximum?: number | DataReference;
  minimum?: number | DataReference;
  exclusiveMaximum?: boolean | DataReference;
  exclusiveMinimum?: boolean | DataReference;
  multipleOf?: number | DataReference;
  default?: number | DataReference;
};

export type BoolTypeOptions = Omit<TypeOptions, "type"> & {
  default?: boolean | DataReference;
};

export type TypeAll = TypeOptions &
  ArrayTypeOptions &
  StringTypeOptions &
  NumTypeOptions &
  BoolTypeOptions;
