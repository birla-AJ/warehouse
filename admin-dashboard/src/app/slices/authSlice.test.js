import { describe, it, expect, beforeEach } from 'vitest';
import reducer, { setSession, sessionExpired, logout } from './authSlice';

const initialState = { accessToken: null, refreshToken: null, user: null, permissions: null };

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no session', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('setSession stores tokens and user, and persists to localStorage', () => {
    const user = { id: 'u1', organizationId: 'org1', roleId: 'r1', roleName: 'WAREHOUSE_OWNER' };
    const state = reducer(initialState, setSession({ accessToken: 'a', refreshToken: 'r', user }));

    expect(state.accessToken).toBe('a');
    expect(state.user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('awms.session')).accessToken).toBe('a');
  });

  it('sessionExpired clears tokens and localStorage', () => {
    const user = { id: 'u1', organizationId: 'org1', roleId: 'r1', roleName: 'VIEWER' };
    const loggedIn = reducer(initialState, setSession({ accessToken: 'a', refreshToken: 'r', user }));
    const expired = reducer(loggedIn, sessionExpired());

    expect(expired.accessToken).toBeNull();
    expect(localStorage.getItem('awms.session')).toBeNull();
  });

  it('logout clears the session the same way sessionExpired does', () => {
    const user = { id: 'u1', organizationId: 'org1', roleId: 'r1', roleName: 'VIEWER' };
    const loggedIn = reducer(initialState, setSession({ accessToken: 'a', refreshToken: 'r', user }));
    const out = reducer(loggedIn, logout());

    expect(out).toEqual(initialState);
  });
});
