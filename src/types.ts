import { RouteOptions, JSONSchema } from "fastify";
import {
  Providers,
  Constructable,
  ProviderToken,
  DecoratorConfig,
} from "dormice";

// fastify instance
declare module "fastify" {
  interface FastifyInstance {
    sarah: {
      get<T = any>(token: ProviderToken): T;
    };
  }
}

// controller
export type ControllerConfig = Partial<RouteOptions>;
export type DecoratorControllerConfig = DecoratorConfig<ControllerConfig | void>;

export interface BootstrapOptions {
  controllers?: Constructable[]; // controllers
  schemas?: Constructable[]; // list of object type schema
  providers?: Providers;
  prefix?: string; // prefix all route url
  addSchema?: boolean; // wether add schema to fastify instance. default: true
}

export interface DataReference {
  $data: string;
}

// main type
export interface TypeOptions {
  type?: string;
  title?: string;
  description?: string;
  $comment?: string;
  enum?: any[];
  const?: any | DataReference;
  [key: string]: any;
}

// object type
export type ObjectTypeOptions = Omit<TypeOptions, "type"> & {
  minProperties?: number;
  maxProperties?: number;
  required?: string[];
  properties?: JSONSchema;
  patternProperties?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  dependencies?: JSONSchema;

  examples?: object;
};

// array type
export type ArrayTypeOptions = Omit<TypeOptions, "type"> & {
  minItems?: number | DataReference;
  maxItems?: number | DataReference;
  uniqueItems?: boolean | DataReference;

  examples?: any[];
};

// string type
type StringTransform =
  | "trim"
  | "trimLeft"
  | "trimRight"
  | "toLowerCase"
  | "toUpperCase"
  | "toEnumCase";
export type StringTypeOptions = Omit<TypeOptions, "type"> & {
  minLength?: number | DataReference;
  maxLength?: number | DataReference;
  pattern?: string | DataReference;
  format?: string | DataReference;
  formatMaximum?: string | DataReference;
  formatMinimum?: string | DataReference;
  formatExclusiveMaximum?: boolean | DataReference;
  formatExclusiveMinimum?: boolean | DataReference;

  regexp?: string;
  transform?: StringTransform | StringTransform[];

  default?: string | DataReference;
  examples?: string;
};

// number type
export type NumTypeOptions = Omit<TypeOptions, "type"> & {
  maximum?: number | DataReference;
  minimum?: number | DataReference;
  exclusiveMaximum?: boolean | DataReference;
  exclusiveMinimum?: boolean | DataReference;
  multipleOf?: number | DataReference;

  range?: [number | DataReference, number | DataReference];
  exclusiveRange?: boolean | DataReference;

  default?: number | DataReference;
  examples?: number;
};

// boolean
export type BoolTypeOptions = Omit<TypeOptions, "type"> & {
  default?: boolean | DataReference;

  examples?: boolean;
};

export type TypeAll = TypeOptions &
  ArrayTypeOptions &
  StringTypeOptions &
  NumTypeOptions &
  BoolTypeOptions;
