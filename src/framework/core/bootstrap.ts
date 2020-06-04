import fp from "fastify-plugin";
import { BootstrapOptions } from "../types";
import { FastifyInstance } from "fastify";
import { solveController, solveProviders } from "./solve-config";
import { Container } from "inversify";
import { FastifyInst, BootstrapOpts } from "../tokens";

/**
 * bootstrap
 */
export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  // create a root container
  const rootContainer = await makeRootContainer(inst, opts);

  // solve controllers
  opts.controllers.forEach((controller) => {
    solveController(rootContainer, controller);
  });

  done();
});

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
  container.bind(BootstrapOpts).toConstantValue(opts);

  // provide option providers
  if (opts.providers) {
    await solveProviders(container, opts.providers);
  }

  return container;
}
