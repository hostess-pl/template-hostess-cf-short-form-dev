export type PreferredLoginMethod = 'otp' | 'password'

const LOGIN_METHOD_KEY = 'hw-cms-login-method'

export function readPreferredLoginMethod(): PreferredLoginMethod {
  try {
    return localStorage.getItem(LOGIN_METHOD_KEY) === 'password' ? 'password' : 'otp'
  } catch {
    return 'otp'
  }
}

export function storePreferredLoginMethod(method: PreferredLoginMethod): void {
  try {
    localStorage.setItem(LOGIN_METHOD_KEY, method)
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
