import fp from "fastify-plugin";
import { BootstrapOptions } from "../types";
import { FastifyInstance } from "fastify";
import { solveControllerConfig, solveRootConfig } from "./solve-config";
import { Container } from "inversify";
import { FastifyInst, BootstrapOpts, BootstrapConfig } from "../tokens";
import { solveProviders } from "./solve-providers";

/**
 * bootstrap
 */
export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  // create a root container
  const rootContainer = await makeRootContainer(inst, opts);

  // solve controllers
  opts.controllers.forEach(async (controller) => {
    const configs = await solveControllerConfig(rootContainer, controller);
    configs.forEach((config) => inst.route(config));
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
  // root config
  container.bind(BootstrapConfig).toConstantValue(await solveRootConfig(opts));

  // provide option providers
  if (opts.providers) {
    await solveProviders(container, opts.providers);
  }

  return container;
}
