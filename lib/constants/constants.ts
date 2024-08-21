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

  /**
   * Often, remote operations should be delayed until the main transaction succeeded.
   *
   * Otherwise, the remote operations are also triggered in case of a rollback.
   *
   * To enable this, an outbox can be used to defer remote operations until the success of the current transaction.
   *
   * Benefits of outboxed service :
   *
   * - save events in your database
   * - replay/resend them in case of an error
   * - monitor events for errors
   * - have truly asynchronous events. The transactions in your event handler will no longer be tied to transactions in your event emitter. If event handler fails, it will not have any effect on event emitter.
   *
   * @see {@link [Outboxed](https://cap.cloud.sap/docs/node.js/outbox)}
   */
  OUTBOXED_SRV: 'outboxed_srv',
} as const;

export default CDS_DISPATCHER;
