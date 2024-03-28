/* eslint-disable no-template-curly-in-string */
export const constants = {
  DECORATOR: {
    MIDDLEWARE_KEY: 'MIDDLEWARE_KEY',
    MIDDLEWARE_NAME: 'MIDDLEWARE',
    ENTITY_HANDLER_NAME: 'ENTITY_NAME',
    METHOD_ACCUMULATOR_NAME: 'METHOD_ACCUMULATOR',
    INJECTOR_FIELDS_ACCUMULATOR_NAME: 'INJECTOR_ACCUMULATOR',
    SINGLE_INSTANCE_FLAG_KEY: 'SINGLE_INSTANCE_KEY',
  },

  MESSAGES: {
    NO_HANDLERS_MESSAGE: 'No handler found !',
    UNSUPPORTED_ENHANCEMENT_ACTION: 'Unsupported formatter action !',
    VALIDATOR_FIELD_NOT_EXISTS:
      "Validator '${action}' is trying to validate the field '${field}'. Field '${field}' must be present in the Request body or not to be empty !",
    VALIDATOR_MANDATORY_PROPERTY_DATA:
      "The Request object must contain the '.data' property and must not be empty when '${validator}' validator is used !",
    VALIDATOR_NOT_VALID: "{ ${field} : ${input} } does not meet the constraints of validator '${validator}' !",
  },
};

/**
 * Use SRV to inject the CDS Service into your class as a dependency.
 */
export const SRV = 'srv';

export default constants;
