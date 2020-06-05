import { Constructable } from "../types";
import { registeInjectable } from "../core/register";
import { inject } from "inversify";

// injectable decorator
export function Injectable() {
  return (target: Constructable) => {
    return registeInjectable(target);
  };
}
// wrapper to suit with another decorators
export const Inject = inject;
