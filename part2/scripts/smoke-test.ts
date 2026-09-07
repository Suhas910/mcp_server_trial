/**
 * End-to-end smoke test for the FoodGroups API.
 *
 * Runs the real Express app against a real Postgres — PGlite, Postgres compiled
 * to WASM, exposed over the wire protocol so `pg` connects to it unchanged.
 * That means no Docker and no installed Postgres, while still exercising the
 * actual SQL (ON CONFLICT upserts, `xmax`, aggregate FILTER, uuid casts).
 *
 *   npm run test:smoke
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';

const DB_PORT = 5433;

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
  }
}

async function main(): Promise<void> {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  const dbServer = new PGLiteSocketServer({ db, port: DB_PORT, host: '127.0.0.1' });
  await dbServer.start();

  // config.ts reads these at import time, so they must be set before it loads.
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
  process.env.JWT_SECRET = 'smoke-test-secret-not-for-production';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.PG_POOL_MAX = '1';

  const schema = await readFile(fileURLToPath(new URL('../src/db/schema.sql', import.meta.url)), 'utf8');
  await db.exec(schema);
  console.log('schema applied\n');

  const { createApp } = await import('../src/app.js');
  const { pool } = await import('../src/db/pool.js');

  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const call = async (
    method: string,
    path: string,
    options: { token?: string; body?: unknown } = {},
  ): Promise<{ status: number; body: any }> => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  };

  const register = (name: string, email: string) =>
    call('POST', '/auth/register', {
      body: { email, password: 'correct-horse-battery', name, avatar: '🙂', color: '#f59e0b' },
    });

  try {
    console.log('health + auth');
    check('GET /health is ok', (await call('GET', '/health')).body?.status === 'ok');

    const alice = await register('Alice', 'alice@example.com');
    const bob = await register('Bob', 'bob@example.com');
    const carol = await register('Carol', 'carol@example.com');
    check('POST /auth/register returns 201 + token', alice.status === 201 && !!alice.body.token, alice.body);
    check('duplicate email is rejected with 409', (await register('Alice2', 'alice@example.com')).status === 409);
    check(
      'weak password is rejected with 400',
      (await call('POST', '/auth/register', { body: { email: 'x@y.com', password: 'short', name: 'X' } })).status === 400,
    );

    const aliceToken = alice.body.token as string;
    const bobToken = bob.body.token as string;
    const carolToken = carol.body.token as string;

    const login = await call('POST', '/auth/login', {
      body: { email: 'alice@example.com', password: 'correct-horse-battery' },
    });
    check('POST /auth/login returns a token', login.status === 200 && !!login.body.token, login.body);
    check(
      'wrong password is rejected with 401',
      (await call('POST', '/auth/login', { body: { email: 'alice@example.com', password: 'nope' } })).status === 401,
    );
    check('GET /auth/me identifies the caller', (await call('GET', '/auth/me', { token: aliceToken })).body.user.name === 'Alice');
    check('GET /groups without a token is 401', (await call('GET', '/groups')).status === 401);
    check('GET /groups with a junk token is 401', (await call('GET', '/groups', { token: 'garbage' })).status === 401);

    console.log('\ngroups');
    const created = await call('POST', '/groups', {
      token: aliceToken,
      body: { name: 'The Hungry Squad', description: 'We eat', emoji: '🍜', color: '#f59e0b' },
    });
    check('POST /groups returns 201', created.status === 201, created.body);
    const group = created.body.group;
    check('creator is the first member', group.members.length === 1 && group.members[0].name === 'Alice', group.members);
    check('an invite code is generated', typeof group.inviteCode === 'string' && group.inviteCode.length === 6, group.inviteCode);

    const joined = await call('POST', `/groups/${group.inviteCode}/join`, { token: bobToken });
    check(
      'POST /groups/:code/join joins by invite code',
      joined.status === 200 && joined.body.group.members.length === 2,
      joined.body.group?.members,
    );
    const rejoined = await call('POST', `/groups/${group.id}/join`, { token: bobToken });
    check('re-joining by id is idempotent', rejoined.status === 200 && rejoined.body.group.members.length === 2);
    check('joining an unknown code is 404', (await call('POST', '/groups/ZZZZZZ/join', { token: bobToken })).status === 404);
    check('a non-member cannot read the group (403)', (await call('GET', `/groups/${group.id}`, { token: carolToken })).status === 403);

    console.log('\nfood items');
    const food = await call('POST', `/groups/${group.id}/foods`, {
      token: aliceToken,
      body: { name: 'Spicy Tuna Roll', description: 'Fire', category: 'Seafood', imageUrl: 'https://x/y.jpg' },
    });
    check('POST /groups/:id/foods returns 201', food.status === 201, food.body);
    const foodId = food.body.foodItem.id;
    check('food item records who added it', food.body.foodItem.addedByName === 'Alice', food.body.foodItem);
    check(
      'an invalid category is rejected with 400',
      (await call('POST', `/groups/${group.id}/foods`, { token: aliceToken, body: { name: 'X', category: 'Nonsense' } })).status === 400,
    );
    check(
      'a non-member cannot add food (403)',
      (await call('POST', `/groups/${group.id}/foods`, { token: carolToken, body: { name: 'X' } })).status === 403,
    );

    console.log('\nreviews');
    const review = await call('POST', `/foods/${foodId}/reviews`, { token: bobToken, body: { rating: 5, text: 'Incredible' } });
    check('POST /foods/:id/reviews returns 201 on first review', review.status === 201, review.body);
    const updated = await call('POST', `/foods/${foodId}/reviews`, { token: bobToken, body: { rating: 4, text: 'Still great' } });
    check('re-reviewing updates rather than duplicating (200)', updated.status === 200, updated.body);
    const reviewList = await call('GET', `/foods/${foodId}/reviews`, { token: bobToken });
    check('one review per member is enforced', reviewList.body.reviews.length === 1, reviewList.body.reviews);
    check('the review reflects the update', reviewList.body.reviews[0].rating === 4, reviewList.body.reviews[0]);
    check(
      'a rating outside 1-5 is rejected with 400',
      (await call('POST', `/foods/${foodId}/reviews`, { token: aliceToken, body: { rating: 9 } })).status === 400,
    );

    const reviewId = reviewList.body.reviews[0].id;
    const liked = await call('POST', `/reviews/${reviewId}/like`, { token: aliceToken });
    check('liking a review records the like', liked.body.review.likes.length === 1, liked.body.review?.likes);
    const unliked = await call('POST', `/reviews/${reviewId}/like`, { token: aliceToken });
    check('liking again toggles it off', unliked.body.review.likes.length === 0, unliked.body.review?.likes);

    console.log('\ncomments');
    const comment = await call('POST', `/foods/${foodId}/comments`, { token: bobToken, body: { text: 'Where is this from?' } });
    check('POST /foods/:id/comments returns 201', comment.status === 201, comment.body);
    const commentId = comment.body.comment.id;
    check(
      'an empty comment is rejected with 400',
      (await call('POST', `/foods/${foodId}/comments`, { token: aliceToken, body: { text: '   ' } })).status === 400,
    );
    const likedComment = await call('POST', `/comments/${commentId}/like`, { token: aliceToken });
    check('liking a comment records the like', likedComment.body.comment.likes.length === 1, likedComment.body.comment?.likes);
    check(
      'a non-member cannot comment (403)',
      (await call('POST', `/foods/${foodId}/comments`, { token: carolToken, body: { text: 'hi' } })).status === 403,
    );

    console.log('\nnested shape matches part1/src/types');
    const groups = await call('GET', '/groups', { token: bobToken });
    const full = groups.body.groups[0];
    check('GET /groups returns only groups the caller belongs to', groups.body.groups.length === 1, groups.body.groups?.length);
    check('group carries members and foodItems', full.members.length === 2 && full.foodItems.length === 1, full);
    const nestedFood = full.foodItems[0];
    check('food item carries reviews and comments', nestedFood.reviews.length === 1 && nestedFood.comments.length === 1, nestedFood);
    check(
      'review is denormalised with member display fields',
      nestedFood.reviews[0].memberName === 'Bob' && typeof nestedFood.reviews[0].memberAvatar === 'string',
      nestedFood.reviews[0],
    );
    check('likes are an array of member ids', Array.isArray(nestedFood.comments[0].likes) && nestedFood.comments[0].likes.length === 1);
    check(
      'createdAt is an ISO string',
      typeof nestedFood.createdAt === 'string' && !Number.isNaN(Date.parse(nestedFood.createdAt)),
      nestedFood.createdAt,
    );
    check('carol sees no groups', (await call('GET', '/groups', { token: carolToken })).body.groups.length === 0);

    console.log('\nprofile + 404s');
    const profile = await call('PATCH', '/auth/me', { token: carolToken, body: { name: 'Caroline', avatar: '🌮' } });
    check('PATCH /auth/me updates the profile', profile.body.user.name === 'Caroline' && profile.body.user.avatar === '🌮', profile.body);
    check('an unknown route is 404', (await call('GET', '/nope')).status === 404);
    check('a non-uuid food id is 404, not a 500', (await call('GET', '/foods/not-a-uuid', { token: aliceToken })).status === 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
    await dbServer.stop();
    await db.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
