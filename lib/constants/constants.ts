/**
 * CDS-TS-Dispatcher app helper constants.
 */
export const CDS_DISPATCHER = {
  /**
   * Represents all entities. Use `CDS_DISPATCHER.ALL_ENTITIES` with the `EntityHandler` decorator to target all entities in your application.
   *
   * This is a constant, but you can also use the asterisk (`*`) instead of `CDS_DISPATCHER.ALL_ENTITIES`.
   * @example
   * "@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)"
   */
  ALL_ENTITIES: '*',

  /**
   * Represents the CDS Service. Use `CDS_DISPATCHER.SRV` to inject the CDS Service into your class as a dependency.
   *
   * This is a constant, but you can also use the string `'srv'` instead of `CDS_DISPATCHER.SRV`.
   * @example
   * "@Inject(CDS_DISPATCHER.SRV) private readonly srv: Service"
   */
  SRV: 'srv',
} as const;

export default CDS_DISPATCHER;
