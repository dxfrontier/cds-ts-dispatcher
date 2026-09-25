/**
 * In-process integration tests for a class-level `@Use` on a draft-enabled entity, over real HTTP
 * (cds.test's axios client), so the OData draft routing and the direct CRUD on active instances
 * (enabled by default in `@sap/cds` 10) are the real ones.
 *
 * Fixture `GatedDraftService` (`srv/controller/gated-draft-service/`):
 * - `Documents` is draft-enabled; `GatedDocumentHandler` carries `@Use(MiddlewareGatedKeys)` plus one no-op
 *   handler method.
 * - `Notes` is a plain entity; `GatedNoteHandler` carries `@Use(MiddlewareGatedKeys)` and NO handler method.
 *
 * `MiddlewareGatedKeys` rejects every non-READ request on a key >= 900 with 403 and records one entry
 * `<event> <target>` per execution. The chain runs once per service-level request CAP dispatches: the lean
 * draft runtime splits one OData call into several of them (e.g. a list READ reads the active entity AND
 * its drafts, `draftActivate` reads the draft), and the OData adapter runs its read-after-write as a
 * separate request - each is pinned below as the exact sequence the gate saw. The one exception is the
 * write `draftActivate` dispatches on the active entity (`CREATE` for a new row, `UPDATE` for an edited
 * one): the draft's content already passed the chain at NEW / EDIT / PATCH, so it is not run again.
 */
import path from 'node:path';
import cds from '@sap/cds';

import { MiddlewareGatedKeys } from '../../sample-project/bookshop/srv/middleware/MiddlewareGatedKeys';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const service = '/odata/v4/gated-draft';
const documents = `${service}/Documents`;
const notes = `${service}/Notes`;

const ACTIVE = 'GatedDraftService.Documents';
const DRAFTS = 'GatedDraftService.Documents.drafts';
const NOTES = 'GatedDraftService.Notes';

/** Runs one HTTP call and returns its status plus every gate execution it caused. */
const call = async (request: () => Promise<any>): Promise<{ status: number; executions: string[] }> => {
  MiddlewareGatedKeys.executions.length = 0;

  let status: number;
  try {
    status = (await request()).status;
  } catch (error: any) {
    status = error.status ?? error.response?.status;
  }

  return { status, executions: [...MiddlewareGatedKeys.executions] };
};

const activeRow = async (entity: string, ID: number) => await cds.db.run(cds.ql.SELECT.one.from(entity).where({ ID }));

beforeAll(async () => {
  await cds.db.run(
    cds.ql.INSERT.into('GatedDocumentsEntity').entries([
      { ID: 1, title: 'open' },
      { ID: 2, title: 'open' },
      { ID: 3, title: 'open' },
      { ID: 4, title: 'open' },
      { ID: 901, title: 'reserved' },
      { ID: 902, title: 'reserved' },
      { ID: 903, title: 'reserved' },
    ]),
  );
});

describe('Class-level @Use on a draft-enabled entity', () => {
  describe('active entity (direct CRUD)', () => {
    test('It should REJECT : an active POST on a reserved key with 403 and create no row', async () => {
      const res = await call(() => client.POST(documents, { ID: 910, title: 'new', IsActiveEntity: true }, { auth }));

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`CREATE ${ACTIVE}`]);
      expect(await activeRow('GatedDocumentsEntity', 910)).toBeUndefined();
    });

    test('It should REJECT : an active PATCH on a reserved key with 403 and leave the row unchanged', async () => {
      const res = await call(() => client.PATCH(`${documents}(ID=901,IsActiveEntity=true)`, { title: 'x' }, { auth }));

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`UPDATE ${ACTIVE}`]);
      expect(await activeRow('GatedDocumentsEntity', 901)).toEqual({ ID: 901, title: 'reserved' });
    });

    test('It should REJECT : an active DELETE on a reserved key with 403 and keep the row', async () => {
      const res = await call(() => client.DELETE(`${documents}(ID=902,IsActiveEntity=true)`, { auth }));

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`DELETE ${ACTIVE}`]);
      expect(await activeRow('GatedDocumentsEntity', 902)).toEqual({ ID: 902, title: 'reserved' });
    });

    test('It should PASS : an active POST on an open key, running the chain for the write and its read-after-write', async () => {
      const res = await call(() => client.POST(documents, { ID: 10, title: 'new', IsActiveEntity: true }, { auth }));

      expect(res.status).toBe(201);
      expect(res.executions).toEqual([`CREATE ${ACTIVE}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);
      expect(await activeRow('GatedDocumentsEntity', 10)).toEqual({ ID: 10, title: 'new' });
    });

    test('It should PASS : an active PATCH on an open key', async () => {
      const res = await call(() =>
        client.PATCH(`${documents}(ID=1,IsActiveEntity=true)`, { title: 'patched' }, { auth }),
      );

      expect(res.status).toBe(200);
      expect(res.executions).toEqual([`UPDATE ${ACTIVE}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);
      expect(await activeRow('GatedDocumentsEntity', 1)).toEqual({ ID: 1, title: 'patched' });
    });

    test('It should PASS : an active DELETE on an open key', async () => {
      const res = await call(() => client.DELETE(`${documents}(ID=2,IsActiveEntity=true)`, { auth }));

      expect(res.status).toBe(204);
      expect(res.executions).toEqual([`DELETE ${ACTIVE}`]);
      expect(await activeRow('GatedDocumentsEntity', 2)).toBeUndefined();
    });

    test('It should RUN : the chain for the active and the draft half of a list READ', async () => {
      const res = await call(() => client.GET(documents, { auth }));

      expect(res.status).toBe(200);
      expect(res.executions).toEqual([`READ ${ACTIVE}`, `READ ${DRAFTS}`]);
    });
  });

  describe('draft choreography', () => {
    test('It should REJECT : a new draft on a reserved key with 403', async () => {
      const res = await call(() => client.POST(documents, { ID: 920, title: 'draft' }, { auth }));

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`NEW ${DRAFTS}`]);
    });

    test('It should REJECT : draftEdit of a reserved active row with 403 and create no draft', async () => {
      const res = await call(() =>
        client.POST(`${documents}(ID=903,IsActiveEntity=true)/GatedDraftService.draftEdit`, {}, { auth }),
      );

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`EDIT ${ACTIVE}`]);
      expect(await activeRow(DRAFTS, 903)).toBeUndefined();
    });

    test('It should PASS : new draft, draft PATCH and draftActivate on an open key, pinning the chain per step', async () => {
      const created = await call(() => client.POST(documents, { ID: 20, title: 'draft' }, { auth }));
      expect(created.status).toBe(201);
      expect(created.executions).toEqual([`NEW ${DRAFTS}`, `CREATE ${DRAFTS}`, `READ ${DRAFTS}`]);

      const patched = await call(() =>
        client.PATCH(`${documents}(ID=20,IsActiveEntity=false)`, { title: 'draft patched' }, { auth }),
      );
      expect(patched.status).toBe(200);
      expect(patched.executions).toEqual([`UPDATE ${DRAFTS}`, `READ ${DRAFTS}`]);

      const activated = await call(() =>
        client.POST(`${documents}(ID=20,IsActiveEntity=false)/GatedDraftService.draftActivate`, {}, { auth }),
      );
      expect(activated.status).toBe(201);
      // the CREATE activation dispatches on the active entity does not run the chain again
      expect(activated.executions).toEqual([`READ ${DRAFTS}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);
      expect(await activeRow('GatedDocumentsEntity', 20)).toEqual({ ID: 20, title: 'draft patched' });
    });

    test('It should PASS : draftEdit, draft PATCH and draftActivate of an existing row, pinning the chain per step', async () => {
      const edited = await call(() =>
        client.POST(`${documents}(ID=4,IsActiveEntity=true)/GatedDraftService.draftEdit`, {}, { auth }),
      );
      expect(edited.status).toBe(201);
      expect(edited.executions).toEqual([`EDIT ${ACTIVE}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);

      const patched = await call(() =>
        client.PATCH(`${documents}(ID=4,IsActiveEntity=false)`, { title: 'edited' }, { auth }),
      );
      expect(patched.status).toBe(200);
      expect(patched.executions).toEqual([`UPDATE ${DRAFTS}`, `READ ${DRAFTS}`]);

      const activated = await call(() =>
        client.POST(`${documents}(ID=4,IsActiveEntity=false)/GatedDraftService.draftActivate`, {}, { auth }),
      );
      expect(activated.status).toBe(200);
      // the UPDATE activation dispatches on the active entity does not run the chain again
      expect(activated.executions).toEqual([`READ ${DRAFTS}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);
      expect(await activeRow('GatedDocumentsEntity', 4)).toEqual({ ID: 4, title: 'edited' });
      expect(await activeRow(DRAFTS, 4)).toBeUndefined();
    });

    test('It should PASS : draftEdit and discard on an open key, pinning the chain per step', async () => {
      const edited = await call(() =>
        client.POST(`${documents}(ID=3,IsActiveEntity=true)/GatedDraftService.draftEdit`, {}, { auth }),
      );
      expect(edited.status).toBe(201);
      expect(edited.executions).toEqual([`EDIT ${ACTIVE}`, `READ ${ACTIVE}`, `READ ${DRAFTS}`]);

      const discarded = await call(() => client.DELETE(`${documents}(ID=3,IsActiveEntity=false)`, { auth }));
      expect(discarded.status).toBe(204);
      expect(discarded.executions).toEqual([`CANCEL ${DRAFTS}`, `DELETE ${DRAFTS}`]);
      expect(await activeRow('GatedDocumentsEntity', 3)).toEqual({ ID: 3, title: 'open' });
    });
  });

  describe('class without handler methods', () => {
    test('It should REJECT : a POST on a reserved key with 403, although the class has only the class-level @Use', async () => {
      const res = await call(() => client.POST(notes, { ID: 950, text: 'note' }, { auth }));

      expect(res.status).toBe(403);
      expect(res.executions).toEqual([`CREATE ${NOTES}`]);
      expect(await activeRow('GatedNotesEntity', 950)).toBeUndefined();
    });

    test('It should PASS : a POST on an open key', async () => {
      const res = await call(() => client.POST(notes, { ID: 50, text: 'note' }, { auth }));

      expect(res.status).toBe(201);
      expect(res.executions).toEqual([`CREATE ${NOTES}`, `READ ${NOTES}`]);
    });
  });
});
