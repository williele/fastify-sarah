import { makeDecorator, processDecorators } from "dormice";
import { Constructable } from "dormice/dist/types";
import { ControllerConfig, DecoratorControllerConfig } from "./types";
import {
  CONTROLLER_SUB,
  CONTROLLER_ROOT,
  CONTROLLER_PARAM,
} from "./metadatakeys";
import { RouteOptions, FastifyRequest, FastifyReply } from "fastify";
import { mergeConfigs } from "./utils/merge-config";
import { Container } from "inversify";

/**
 * make a custom decorator controller
 */
export function makeControllerDecorator(config: DecoratorControllerConfig) {
  return makeDecorator(config, {
    rootMetadata: CONTROLLER_ROOT,
    subMetadata: CONTROLLER_SUB,
  });
}

/**
 * make controller paramer decorator
 * @param config decorator callback
 * @param resolve resolve how to get parameters
 */
export function makeControllerParamDecorator(
  resolve: (req: FastifyRequest, rep: FastifyReply<any>) => any,
  config: DecoratorControllerConfig["callback"] = () => () => {}
) {
  return makeDecorator(
    {
      on: "parameter",
      callback: (info) => {
        const { target, key, index } = info;
        const params =
          Reflect.getOwnMetadata(CONTROLLER_PARAM, target.constructor, key!) ||
          [];
        params[index!] = resolve;
        Reflect.defineMetadata(
          CONTROLLER_PARAM,
          params,
          target.constructor,
          key!
        );

        return config(info);
      },
    },
    { rootMetadata: CONTROLLER_ROOT, subMetadata: CONTROLLER_SUB }
  );
}

/**
 * merge a controller data
 * @param data decorator data from controller
 */
export function mergeControllerData(
  sub: { [key: string]: ControllerConfig[] },
  root: ControllerConfig[]
): RouteOptions[] {
  const results: RouteOptions[] = [];
  Object.values(sub).forEach((configs) => {
    results.push(mergeConfigs([...root, ...configs]) as RouteOptions);
  });

  return results;
}

/**
 * process a controller factory configs
 */
export async function processController(
  target: Constructable,
  container?: Container
) {
  return processDecorators<ControllerConfig, ControllerConfig>(
    target,
    { rootMetadata: CONTROLLER_ROOT, subMetadata: CONTROLLER_SUB },
    container,
    { makeInstance: true }
  );
}
