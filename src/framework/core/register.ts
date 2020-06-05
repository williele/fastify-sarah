/// define and get metadata from target object

import { FactoryProviderConfig, ControllerConfigFactory } from "../types";
import {
  CONTROLLER_CLASS,
  CONTROLLER_METHOD,
  CLASS_INJECTABLE,
} from "../metakeys";
import { injectable } from "inversify";

// helper function
// config usually of factory providers
// class store config usually an array
export function registeClass<T = any>(
  target,
  symbol: symbol,
  config: FactoryProviderConfig<T>
) {
  const registers: FactoryProviderConfig<T>[] =
    Reflect.getMetadata(symbol, target) || [];
  // freeze and push the factory
  Object.freeze(config);
  registers.push(config);

  // define
  Reflect.defineMetadata(symbol, registers, target);
}

// store config usually an object of factory provider config
// this method can use for both properties and class decorators
export function registeProperties<T = any>(
  target,
  key: string,
  symbol: symbol,
  config: FactoryProviderConfig<T>
) {
  const registers: { [key: string]: FactoryProviderConfig<T>[] } =
    Reflect.getMetadata(symbol, target) || {};
  // freeze and store the factory
  Object.freeze(config);
  registers[key] = registers[key] || [];
  registers[key].push(config);

  // define
  Reflect.defineMetadata(symbol, registers, target);
}

/**
 * register controller class factories
 */
export function registeCtrlClassFactories(
  target,
  config: ControllerConfigFactory
) {
  registeClass(target, CONTROLLER_CLASS, config);
}

/**
 * get controller class factories
 */
export function getCtrlClassFactories(target): ControllerConfigFactory[] {
  return Reflect.getMetadata(CONTROLLER_CLASS, target);
}

/**
 * register controller methods factories
 */
export function registeCtrlMethodFactories(
  target,
  key: string,
  config: ControllerConfigFactory
) {
  registeProperties(target, key, CONTROLLER_METHOD, config);
}

/**
 * get controller methods factories
 */
export function getCtrlMethodFactories(
  target
): { [key: string]: ControllerConfigFactory[] } {
  return Reflect.getMetadata(CONTROLLER_METHOD, target);
}

/**
 * registe injectable for class if not already
 */
export function registeInjectable(target) {
  const isInjectable =
    Reflect.getOwnMetadata(CLASS_INJECTABLE, target) || false;
  if (isInjectable) {
    return target;
  } else {
    Reflect.defineMetadata(CLASS_INJECTABLE, true, target);
    return injectable()(target);
  }
}
