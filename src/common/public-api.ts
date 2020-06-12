// provide many common use decorators

export * from "./controllers";
export * from "./controller-params";
export * from "./schemas";

import { registeInjectable } from "dormice";

// injectable
export function Injectable() {
  return (target) => {
    return registeInjectable(target);
  };
}
