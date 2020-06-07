import fp from 'fastify-plugin';
import { processProviders } from 'dormice';
import { BootstrapOptions } from './types';
import { Fastify } from './tokens';
import { FastifyInstance } from 'fastify';
import { processController } from './controllers';

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

  const controllerPromise = opts.controllers.map((ctrl) => {
    return processController(ctrl, container);
  });
  await Promise.all(controllerPromise);
};
