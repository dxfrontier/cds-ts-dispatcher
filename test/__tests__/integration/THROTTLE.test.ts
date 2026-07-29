import path from 'node:path';
import cds from '@sap/cds';

const bookshop = path.resolve(__dirname, '../../sample-project/bookshop');
const client = cds.test(bookshop) as any;

const auth = { username: 'manager', password: 'manager' };
const userAuth = { username: 'user', password: 'user' };
const catalog = '/odata/v4/catalog';

describe('INTEGRATION - @Throttle', () => {
  test('It should ALLOW : the first 3 calls for one user, then REJECT the 4th with 429', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await client.POST(`${catalog}/throttledPing`, {}, { auth });
      expect(res.status).toBe(200);
    }

    await expect(client.POST(`${catalog}/throttledPing`, {}, { auth })).rejects.toMatchObject({
      status: 429,
    });
  });

  test('It should ISOLATE : a different user still passes after the first user is throttled', async () => {
    const res = await client.POST(`${catalog}/throttledPing`, {}, { auth: userAuth });
    expect(res.status).toBe(200);
  });

  test('It should REPORT : the rejection message carries limit and window', async () => {
    try {
      // manager is exhausted from the first test (same 10s window very likely still open);
      // if the window rolled over, exhaust it again deterministically:
      for (let i = 0; i < 4; i++) {
        await client.POST(`${catalog}/throttledPing`, {}, { auth });
      }
      throw new Error('expected 429');
    } catch (error: any) {
      expect(error.status).toBe(429);
      expect(String(error.message)).toContain('3');
      expect(String(error.message)).toContain('10000');
    }
  });
});
