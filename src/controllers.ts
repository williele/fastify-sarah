import {
  makeDecorator,
  registePropertyMeta,
  registeClassMeta,
  registeInjectable,
} from "dormice";
import { DecoratorConfig } from "dormice/dist/types";
import { ControllerConfig } from "./types";
import {
  CONTROLLER_METHOD,
  CONTROLLER_PROPERTY,
  CONTROLLER_CLASS,
} from "./mtadatakeys";

/**
 * make a custom decorator controller
 */
export function makeControllerDecorator(
  config: DecoratorConfig<ControllerConfig>
) {
  return makeDecorator(config, (info, config) => {
    if (info.on === "method") {
      registePropertyMeta(info.target, info.key!, CONTROLLER_METHOD, config);
    } else if (info.on === "property") {
      registePropertyMeta(info.target, info.key!, CONTROLLER_PROPERTY, config);
    } else if (info.on === "class") {
      registeClassMeta(info.target, CONTROLLER_CLASS, config);
      return registeInjectable(info.target);
    }
  });
}
