import { makeDecorator } from "dormice";
import { DecoratorConfig } from "dormice/dist/types";
import { ControllerConfig } from "./types";
import { CONTROLLER_SUB, CONTROLLER_ROOT } from "./mtadatakeys";

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
