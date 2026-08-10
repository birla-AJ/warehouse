import authReducer, { loginSuccess, logout, selectIsAdmin, selectIsAuthenticated } from '../src/store/slices/authSlice';

describe('authSlice', () => {
  const initialState = authReducer(undefined, { type: '@@INIT' });

  it('starts logged out', () => {
    expect(selectIsAuthenticated({ auth: initialState })).toBe(false);
  });

  it('logs in and stores the session', () => {
    const state = authReducer(
      initialState,
      loginSuccess({
        accessToken: 'a',
        refreshToken: 'b',
        user: { id: '1', roleName: 'Warehouse Manager' },
      }),
    );
    expect(selectIsAuthenticated({ auth: state })).toBe(true);
    expect(state.user.roleName).toBe('Warehouse Manager');
  });

  it('treats any role name containing "admin" (case-insensitive) as admin', () => {
    const adminState = authReducer(initialState, loginSuccess({ accessToken: 'a', refreshToken: 'b', user: { roleName: 'Super Admin' } }));
    expect(selectIsAdmin({ auth: adminState })).toBe(true);

    const staffState = authReducer(initialState, loginSuccess({ accessToken: 'a', refreshToken: 'b', user: { roleName: 'Operator' } }));
    expect(selectIsAdmin({ auth: staffState })).toBe(false);
  });

  it('clears the session on logout', () => {
    const loggedIn = authReducer(initialState, loginSuccess({ accessToken: 'a', refreshToken: 'b', user: { roleName: 'Admin' } }));
    const loggedOut = authReducer(loggedIn, logout());
    expect(selectIsAuthenticated({ auth: loggedOut })).toBe(false);
    expect(loggedOut.user).toBeNull();
  });
});
