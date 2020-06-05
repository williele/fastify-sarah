/// define and get metadata from target object

import { CLASS_INJECTABLE } from "../metakeys";
import { injectable } from "inversify";

// helper function
// class store config usually an array
export function registeClass<T = any>(target, metakey: symbol, config: T) {
  const registers: T[] = Reflect.getMetadata(metakey, target) || [];
  // freeze and push the factory
  Object.freeze(config);
  registers.push(config);

  // define
  Reflect.defineMetadata(metakey, registers, target);
}

// this method can use for both properties and class decorators
export function registeProperties<T = any>(
  target,
  key: string,
  metakey: symbol,
  config: T
) {
  const registers: { [key: string]: T[] } =
    Reflect.getMetadata(metakey, target) || {};
  // freeze and store the factory
  Object.freeze(config);
  registers[key] = registers[key] || [];
  registers[key].push(config);

  // define
  Reflect.defineMetadata(metakey, registers, target);
}

/**
 * register a boolean into metadata
 */
export function registeBoolean(target, metakey: Symbol) {
  Reflect.defineMetadata(metakey, true, target);
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
