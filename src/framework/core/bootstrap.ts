import fp from "fastify-plugin";
import { BootstrapOptions } from "../types";
import { FastifyInstance } from "fastify";
import { solveController, solveProviders } from "./solve-config";
import { Container } from "inversify";
import { FastifyInst, BootstrapOpt } from "../tokens";

/**
 * bootstrap
 */
export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  await boot(inst, opts);
  done();
});

// compile
export async function boot(inst: FastifyInstance, opts: BootstrapOptions) {
  // create a root container
  const rootContainer = await makeRootContainer(inst, opts);

  opts.controllers.forEach((controller) => {
    solveController(rootContainer, controller);
  });
}

/**
 * create default root container
 */
export async function makeRootContainer(
  inst: FastifyInstance,
  opts: BootstrapOptions
) {
  const container = new Container({ autoBindInjectable: true });

  // core providers
  container.bind(FastifyInst).toConstantValue(inst);
  container.bind(BootstrapOpt).toConstantValue(opts);

  // provide option providers
  if (opts.providers) {
    await solveProviders(container, opts.providers);
  }

  return container;
}
