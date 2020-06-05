import {
  RegistryConfig,
  RegistryConfigInfo,
  ControllerConfigFactory,
} from "../types";
import { registeInjectable, registeClass, registeProperties } from "./register";
import {
  CONTROLLER_CLASS,
  CONTROLLER_METHOD,
  SCHEMA_METHOD,
  SCHEMA_CLASS,
} from "../metakeys";

/**
 * create class or method decorator for override config
 */
export function makeDecorator<T>(
  registry: RegistryConfig,
  callback: (info: RegistryConfigInfo, config: T) => void
) {
  return (target, key?: string, descriptor?: PropertyDescriptor) => {
    // method decorator
    const type = Reflect.getMetadata("design:type", target, key!);
    const returnType = Reflect.getMetadata("design:returntype", target, key!);
    const paramType = Reflect.getMetadata("design:paramtypes", target);
    const typeInfo: Partial<RegistryConfigInfo> = {
      type,
      returnType,
      paramType,
    };

    if (descriptor !== undefined && registry.on.includes("method")) {
      const info: RegistryConfigInfo = {
        on: "method",
        target,
        key,
        descriptor,
        ...typeInfo,
      };
      const config = registry.callback(info);
      return callback(info, config as any);
    }

    // properties decorator
    if (key !== undefined && registry.on.includes("property")) {
      const info: RegistryConfigInfo = {
        on: "property",
        target,
        key,
        ...typeInfo,
      };
      const config = registry.callback(info);
      return callback(info, config);
    }

    // class decorator
    if (registry.on.includes("class")) {
      const info: RegistryConfigInfo = { on: "class", target, ...typeInfo };
      const config = registry.callback(info);
      return callback(info, config);
    }
  };
}

/**
 * make controller decorators
 */
export function makeControllerDecorator(
  registry: RegistryConfig<ControllerConfigFactory>
) {
  return makeDecorator<ControllerConfigFactory>(
    registry,
    ({ on, target, key }, config) => {
      if (on === "method") {
        if (config) {
          registeProperties(
            target.constructor,
            key as string,
            CONTROLLER_METHOD,
            config
          );
        }
      } else if (on === "class") {
        if (config) {
          registeClass(target, CONTROLLER_CLASS, config);
        }
        return registeInjectable(target);
      }
    }
  );
}

/**
 * make schema decorators
 */
export function makeSchemaDecorator(registry: RegistryConfig) {
  return makeDecorator(registry, ({ on, target, key }, config) => {
    if (on === "property") {
      if (config) {
        registeProperties(
          target.constructor,
          key as string,
          SCHEMA_METHOD,
          config
        );
      }
    } else if (on === "class") {
      if (config) {
        registeClass(target, SCHEMA_CLASS, config);
      }
    }
  });
}
