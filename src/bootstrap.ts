import fp from "fastify-plugin";
import { createContainer, ProviderToken } from "dormice";
import { BootstrapOptions } from "./types";
import { Fastify, BootstrapConfig } from "./tokens";
import { FastifyInstance } from "fastify";
import { processController } from "./controllers";

export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  try {
    await processBootstrap(inst, opts);
    done();
  } catch (error) {
    done(error);
  }
});

export const processBootstrap = async (
  inst: FastifyInstance,
  opts: BootstrapOptions
) => {
  // create a new container
  const container = await createContainer([
    { token: Fastify, useValue: inst },
    { token: BootstrapConfig, useValue: opts },
    ...(opts.providers || []),
  ]);

  // processing controllers
  const controllerPromise = opts.controllers.map((ctrl) => {
    return processController(ctrl, container);
  });
  await Promise.all(controllerPromise);

  // decorate sarah methods
  inst.decorate("sarah", {
    get: (token: ProviderToken) => container.get(token),
  });
};
