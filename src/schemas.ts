import { DecoratorConfig, makeDecorator } from 'dormice';
import { SCHEMA_ROOT, SCHEMA_SUB } from './metadatakeys';

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
