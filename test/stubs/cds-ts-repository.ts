/**
 * Test-harness stub for `@dxfrontier/cds-ts-repository` (integration suite only).
 *
 * The monorepo admin fixture's CatalogService repositories `extend BaseRepository` from the
 * companion package `@dxfrontier/cds-ts-repository`, which is NOT a dependency of this repo
 * (its published peer is `@sap/cds@^9`, incompatible with the `@sap/cds@^10` used here). That
 * missing dependency is the sole reason the admin app was never runnable.
 *
 * We must not edit the fixture's source, and installing the incompatible package would
 * destabilize the workspace, so this stub provides a constructable no-op `BaseRepository`
 * purely so the app can boot. The AdminService handlers under test inject only the service
 * (`CDS_DISPATCHER.SRV`), never a repository, so no repository method is ever exercised.
 */
export class BaseRepository<T = unknown> {
  protected readonly entity: unknown;

  constructor(entity?: unknown) {
    this.entity = entity;
  }
}

export default { BaseRepository };
