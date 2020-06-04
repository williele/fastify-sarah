/// merging fastify configuration
import { RouteOptions } from "fastify";
import { join } from "path";

const DEFAULT_CONFIG: Partial<RouteOptions> = {
  url: "/",
};

/**
 * merge configures
 */
export function mergeConfigs(configs: Partial<RouteOptions>[]) {
  return configs.reduce((a, b) => combineConfigs({ ...a }, { ...b }), {
    ...DEFAULT_CONFIG,
  });
}

const STACK_PROPERTIES = [
  "onRequest",
  "preParsing",
  "preValidation",
  "preHandler",
  "preSerialization",
  "onSend",
  "onResponse",
];

// combine two config
function combineConfigs(
  a: Partial<RouteOptions>,
  b: Partial<RouteOptions>
): Partial<RouteOptions> {
  const result = a;

  Object.entries(b).forEach(([key, val]) => {
    if (!result[key]) return (result[key] = val);
    // join path
    if (key === "url") return (result[key] = join(result[key]!, val));
    // merge schema
    if (key === "schema")
      return (result[key] = combineObjects(result[key]!, val));
    // stack
    if (STACK_PROPERTIES.includes(key)) {
      if (Array.isArray(result[key])) result[key] = result[key].concat(val);
      else result[key] = [result[key], val];
      return;
    }
    // replace
    result[key] = val;
  });

  return result;
}

// combine two object
function combineObjects(a: object, b: object) {
  const result = a;
  Object.entries(b).forEach(([key, val]) => {
    if (!result[key]) return (result[key] = val);
    // merge array
    if (Array.isArray(result[key]))
      return (result[key] = result[key].concat(val));
    // merge object
    if (typeof result[key] === "object" && typeof val === "object")
      return (result[key] = combineObjects(result[key], val));

    result[key] = val;
  });

  return result;
}
