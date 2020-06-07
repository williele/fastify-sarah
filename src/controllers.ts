import { makeDecorator, processDecorators } from 'dormice';
import { DecoratorConfig, Constructable } from 'dormice/dist/types';
import { ControllerConfig } from './types';
import { CONTROLLER_SUB, CONTROLLER_ROOT } from './metadatakeys';
import { RouteOptions } from 'fastify';
import { mergeConfigs } from './utils/merge-config';
import { Container } from 'inversify';

/**
 * make a custom decorator controller
 */
export function makeControllerDecorator(
  config: DecoratorConfig<ControllerConfig>
) {
  return makeDecorator(config, {
    rootMetadata: CONTROLLER_ROOT,
    subMetadata: CONTROLLER_SUB,
  });
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
    container
  );
}
