/**
 * In-process integration tests for the draft choreography under `@sap/cds` 10.
 *
 * Draft flows are protocol-level (Fiori draft), so they are driven through cds.test's HTTP helpers.
 * Each dispatcher draft handler emits a `req.notify(...)` marker that surfaces in the OData
 * `sap-messages` response header, letting us assert exactly which handlers fired for each step.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';
const bookEvents = `${catalog}/BookEvents`;

const markers = (res: any): string[] => {
  const raw = res?.headers?.['sap-messages'];
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as Array<{ message: string }>).map((m) => m.message);
  } catch {
    return [];
  }
};

/** POST a fresh draft and activate it, returning the active instance ID. */
const createActiveBookEvent = async (name: string): Promise<string> => {
  const created = await client.POST(bookEvents, { name }, { auth });
  const { ID } = created.data;
  await client.POST(`${bookEvents}(ID=${ID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth });
  return ID;
};

describe('Draft choreography (@sap/cds 10)', () => {
  test('It should FIRE @OnNewDraft when a new draft is created', async () => {
    const created = await client.POST(bookEvents, { name: 'Book Launch' }, { auth });
    expect(created.status).toBe(201);
    expect(markers(created)).toContain('On new draft');
  });

  test('It should FIRE @Before/@On/@AfterPatchDraft (in order) when a draft field is patched', async () => {
    const created = await client.POST(bookEvents, { name: 'Patchable' }, { auth });
    const { ID } = created.data;

    const patched = await client.PATCH(`${bookEvents}(ID=${ID},IsActiveEntity=false)`, { name: 'Patched' }, { auth });

    const fired = markers(patched);
    expect(fired).toEqual(expect.arrayContaining(['Before patch draft', 'On patch draft', 'After patch draft']));
    expect(fired.indexOf('Before patch draft')).toBeLessThan(fired.indexOf('On patch draft'));
    expect(fired.indexOf('On patch draft')).toBeLessThan(fired.indexOf('After patch draft'));
  });

  test('It should FIRE @OnSaveDraft when a draft is activated', async () => {
    const created = await client.POST(bookEvents, { name: 'Savable' }, { auth });
    const { ID } = created.data;

    const saved = await client.POST(
      `${bookEvents}(ID=${ID},IsActiveEntity=false)/CatalogService.draftActivate`,
      {},
      { auth },
    );
    expect(markers(saved)).toContain('On save draft');
  });

  test('It should FIRE @OnEditDraft when an active instance is put back into edit', async () => {
    const ID = await createActiveBookEvent('Editable');

    const edited = await client.POST(
      `${bookEvents}(ID=${ID},IsActiveEntity=true)/CatalogService.draftEdit`,
      {},
      { auth },
    );
    expect(markers(edited)).toContain('On edit draft');
  });

  test('It should FIRE BOTH @OnDiscardDraft and the legacy @OnCancelDraft alias on discard', async () => {
    const ID = await createActiveBookEvent('Discardable');
    await client.POST(`${bookEvents}(ID=${ID},IsActiveEntity=true)/CatalogService.draftEdit`, {}, { auth });

    const discarded = await client.DELETE(`${bookEvents}(ID=${ID},IsActiveEntity=false)`, { auth });
    expect(discarded.status).toBe(204);

    const fired = markers(discarded);
    // The alias coexistence shipped in cds 10: canonical @OnDiscardDraft AND legacy @OnCancelDraft.
    expect(fired).toContain('On discard draft');
    expect(fired).toContain('On cancel draft');
    expect(fired).toEqual(expect.arrayContaining(['Before discard draft', 'After discard draft']));
  });

  test('It should BYPASS the draft-patch handlers on a direct PATCH of the active entity', async () => {
    const ID = await createActiveBookEvent('ActiveTarget');

    // cds 10 default (bypass_draft) allows patching the active entity directly - this must hit the
    // ACTIVE UPDATE path, never the draft-patch handlers.
    const patched = await client.PATCH(`${bookEvents}(ID=${ID},IsActiveEntity=true)`, { name: 'Renamed' }, { auth });

    const fired = markers(patched);
    expect(fired).not.toContain('On patch draft');
    expect(fired).not.toContain('Before patch draft');
    expect(fired).not.toContain('After patch draft');
  });
});
