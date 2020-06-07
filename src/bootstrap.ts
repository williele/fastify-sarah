import fp from "fastify-plugin";
import { processProviders, processDecorators } from "dormice";
import { BootstrapOptions, ControllerConfig } from "./types";
import { CONTROLLER_ROOT, CONTROLLER_SUB } from "./mtadatakeys";
import { Fastify } from "./tokens";
import { FastifyInstance, RouteOptions } from "fastify";
import { mergeConfigs, mergeControllerData } from "./utils/merge-config";

export const bootstrap = fp(async (inst, opts: BootstrapOptions, done) => {
  await processBootstrap(inst, opts);

  done();
});

export const processBootstrap = async (
  inst: FastifyInstance,
  opts: BootstrapOptions
) => {
  // create a new container
  const container = await processProviders([
    { token: Fastify, useValue: inst },
    ...(opts.providers || []),
  ]);

  let routes: RouteOptions[] = [];
  for (const controller of opts.controllers) {
    const configs = await processDecorators<ControllerConfig, ControllerConfig>(
      controller,
      { rootMetadata: CONTROLLER_ROOT, subMetadata: CONTROLLER_SUB },
      container
    );

    routes = routes.concat(mergeControllerData(configs));
  }

  // apply routes
  routes.forEach((route) => inst.route(route));
};
