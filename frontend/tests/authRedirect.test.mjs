import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnTo, getReturnTo, getAuthUrl, getLoginUrl } from '../src/utils/authRedirect.ts';

test('preserves internal destination including query and hash', () => {
  const destination = '/checkout?delivery=HOME&note=%E6%B8%AC%E8%A9%A6#receiver';
  assert.equal(safeReturnTo(destination), destination);
  assert.equal(getReturnTo(getAuthUrl('/login', destination).slice('/login'.length)), destination);
});

test('rejects external, malformed, backslash and control-character destinations', () => {
  for (const value of [null, undefined, '', 'https://example.com', '//example.com', 'javascript:alert(1)', 'checkout', '/\\example.com', '/%5cexample.com', '/%2f%2fexample.com', '/bad%escape', '/checkout\n', '/checkout%0a', '/checkout%7f']) {
    assert.equal(safeReturnTo(value), null, String(value));
  }
});

test('rejects normalized and encoded authentication page loops', () => {
  for (const value of ['/login', '/register', '/LOGIN/', '/register?returnTo=%2Fcheckout', '/x/../login', '/%6cogin', '/%72egister/#form']) {
    assert.equal(safeReturnTo(value), null, value);
  }
});

test('missing or invalid destination falls back to profile', () => {
  for (const query of ['', '?returnTo=', '?returnTo=https%3A%2F%2Fexample.com', '?returnTo=%2Flogin']) {
    assert.equal(getReturnTo(query), '/profile');
  }
  assert.equal(getAuthUrl('/login', '//example.com'), '/login');
});

test('login and registration round trip keeps checkout destination', () => {
  const login = getLoginUrl({pathname:'/checkout',search:'?coupon=abc',hash:'#shipping'});
  const destination = getReturnTo(login.slice('/login'.length));
  const register = getAuthUrl('/register', destination);
  const loginAgain = getAuthUrl('/login', getReturnTo(register.slice('/register'.length)));
  assert.equal(getReturnTo(loginAgain.slice('/login'.length)), '/checkout?coupon=abc#shipping');
});

test('header login on authentication pages preserves destination without nesting', () => {
  const search = '?returnTo=%2Fcheckout%3Fcoupon%3Dabc%23shipping';
  for (const pathname of ['/login', '/register', '/LOGIN/']) {
    assert.equal(getLoginUrl({pathname,search,hash:'#form'}), '/login' + search);
  }
  assert.equal(getLoginUrl({pathname:'/login',search:'',hash:''}), '/login');
});

test('ordinary page login returns to the full current URL', () => {
  const login = getLoginUrl({pathname:'/products/42',search:'?color=navy',hash:'#detail'});
  assert.equal(getReturnTo(login.slice('/login'.length)), '/products/42?color=navy#detail');
});
