import {
  DecoratorConfig,
  makeDecorator,
  Constructable,
  processDecorators,
  Container,
  createContainer,
  ParentContainer,
} from "dormice";
import { SCHEMA_ROOT, SCHEMA_SUB } from "./metadatakeys";
import { JSONSchema } from "fastify";
import { combineObjects } from "./utils/merge-config";
import { ProcessSchema } from "./tokens";

/**
 * make custom schema decorator
 * @param config decorator config
 */
export function makeSchemaDecorator(config: DecoratorConfig<any>) {
  return makeDecorator(config, {
    rootMetadata: SCHEMA_ROOT,
    subMetadata: SCHEMA_SUB,
  });
}

/**
 * helper function to merge schema data
 */
export function mergeSchemaData(
  sub: { [key: string]: JSONSchema },
  root: JSONSchema[]
) {
  const subs = Object.values(sub);

  return root.concat(subs).reduce((a, b) => combineObjects(a, b), {});
}

/**
 * process schema from decorators
 * @param target schema class
 * @param container optional parent container
 */
export async function processSchema(
  target: Constructable,
  container?: Container
) {
  const processContainer = await createContainer(
    [
      {
        token: ProcessSchema,
        useFactory: {
          deps: () => [ParentContainer],
          factory: (parentContainer) => (target) =>
            processSchema(target, parentContainer),
        },
      },
    ],
    container
  );

  return processDecorators(
    target,
    { rootMetadata: SCHEMA_ROOT, subMetadata: SCHEMA_SUB },
    processContainer
  );
}
