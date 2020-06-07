import { HTTPMethod, FastifyInstance } from 'fastify';
import { makeControllerDecorator, mergeControllerData } from '../controllers';
import { RootInstance, SubData, PreviousData } from 'dormice';
import { Fastify } from '../tokens';
import { ControllerConfig } from '../types';

export function Controller(url: string = '') {
  return makeControllerDecorator({
    on: ['class'],
    callback: () => ({
      deps: () => [Fastify, SubData, PreviousData],
      factory: (
        fastify: FastifyInstance,
        sub: { [key: string]: ControllerConfig[] },
        root: ControllerConfig[]
      ) => {
        const routes = mergeControllerData(sub, [{ url }, ...root]);
        routes.forEach((route) => fastify.route(route));

        return { url };
      },
    }),
  });
}

export function Route(method: HTTPMethod, url: string = '') {
  return makeControllerDecorator({
    on: ['method'],
    callback: ({ descriptor }) => ({
      deps: () => [RootInstance],
      factory: (inst) => ({
        method,
        url,
        handler: async (req, res) => {
          return descriptor?.value.apply(inst, [req, res]);
        },
      }),
    }),
  });
}

// shorthand route
export const Get = (url: string = '') => Route('GET', url);
export const Head = (url: string = '') => Route('HEAD', url);
export const Options = (url: string = '') => Route('OPTIONS', url);
export const Post = (url: string = '') => Route('POST', url);
export const Put = (url: string = '') => Route('PUT', url);
export const Patch = (url: string = '') => Route('PATCH', url);
export const Delete = (url: string = '') => Route('DELETE', url);
