const constants = {
  DECORATOR: {
    MIDDLEWARE_KEY: 'MIDDLEWARE_KEY',
    MIDDLEWARE_NAME: 'MIDDLEWARE',
    ENTITY_HANDLER_NAME: 'ENTITY_NAME',
    METHOD_ACCUMULATOR_NAME: 'METHOD_ACCUMULATOR',
    INJECTOR_FIELDS_ACCUMULATOR_NAME: 'INJECTOR_ACCUMULATOR',
    SINGLE_INSTANCE_FLAG_KEY: 'SINGLE_INSTANCE_KEY',
  },
};

/**
 * Use SRV to inject the CDS Service into your class as a dependency.
 */
const SRV = 'srv';

export { constants, SRV };
