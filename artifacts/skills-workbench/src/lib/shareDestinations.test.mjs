import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDestinationHref,
  buildSharePageUrl,
  shareDestinations,
} from './shareDestinations.ts';

test('share page links respect the artifact base path and encode the token', () => {
  assert.equal(
    buildSharePageUrl('abc_def-123', 'https://example.test', '/workbench/'),
    'https://example.test/workbench/share/abc_def-123',
  );
});

test('every configured social destination carries the exact selected share URL', () => {
  const shareUrl = 'https://example.test/share/opaque-token?version=2';
  const configured = new Set(shareDestinations.map(({ id }) => id));
  assert.deepEqual(
    [...configured].sort(),
    ['copy', 'email', 'facebook', 'linkedin', 'replit', 'text', 'x'],
  );
  for (const destination of ['email', 'text', 'facebook', 'x', 'linkedin']) {
    const href = buildDestinationHref(destination, shareUrl, 'C++ & APIs');
    assert.ok(href);
    const parsed = new URL(href);
    const sharedValue =
      destination === 'email'
        ? new URLSearchParams(parsed.search).get('body')
        : destination === 'text'
          ? new URLSearchParams(parsed.search).get('body')
          : destination === 'facebook'
            ? new URLSearchParams(parsed.search).get('u')
            : destination === 'x'
              ? new URLSearchParams(parsed.search).get('url')
              : new URLSearchParams(parsed.search).get('url');
    assert.equal(sharedValue, shareUrl);
  }
  assert.equal(buildDestinationHref('replit', shareUrl, 'C++ & APIs'), null);
  assert.equal(buildDestinationHref('copy', shareUrl, 'C++ & APIs'), null);
});
