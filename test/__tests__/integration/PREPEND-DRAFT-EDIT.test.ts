/**
 * In-process integration test proving the M6 fix: `@PrependDraft({ eventDecorator: 'BeforeEditDraft' })`
 * must mirror `@BeforeEditDraft`'s own `isDraft: false` registration (the ACTIVE entity) instead of
 * hardcoding `isDraft: true` (`<Entity>.drafts`) - otherwise the prepended callback registers against
 * `BookEvents.drafts` and never fires for a real `draftEdit`, which CAP dispatches on the active entity.
 *
 * `BookEventsHandler.prependBeforeEditDraft` (`@EntityHandler(BookEvent)`) logs one `console.log` marker
 * (`[PrependBeforeEditDraft] fired`) - kept deliberately separate from `DRAFT-CHOREOGRAPHY.test.ts`'s
 * `req.notify(...)` / `sap-messages` markers, so a console spy here is invisible to that suite (and vice
 * versa), keeping both independent.
 */
import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const catalog = '/odata/v4/catalog';
const bookEvents = `${catalog}/BookEvents`;

const MARKER = '[PrependBeforeEditDraft] fired';

/** POST a fresh draft and activate it, returning the active instance ID. */
const createActiveBookEvent = async (name: string): Promise<string> => {
  const created = await client.POST(bookEvents, { name }, { auth });
  const { ID } = created.data;
  await client.POST(`${bookEvents}(ID=${ID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth });
  return ID;
};

describe('@PrependDraft on an EDIT/SAVE-group decorator registers on the ACTIVE entity (M6)', () => {
  test('It should FIRE : the @PrependDraft({ eventDecorator: "BeforeEditDraft" }) probe on a real draftEdit', async () => {
    const ID = await createActiveBookEvent('PrependEditable');

    const spy = jest.spyOn(console, 'log');
    await client.POST(`${bookEvents}(ID=${ID},IsActiveEntity=true)/CatalogService.draftEdit`, {}, { auth });

    const calls = spy.mock.calls.map((c) => String(c[0]));
    spy.mockRestore();

    expect(calls).toContain(MARKER);
  });
});
