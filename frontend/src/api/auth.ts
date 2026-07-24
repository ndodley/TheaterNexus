import { api } from './client'

// Note: core session actions (login, register, logout, token refresh) live in
// AuthContext, which already wraps them behind useAuth(). These helpers cover
// the extra account endpoints used directly by a few pages (Profile, Welcome,
// VerifyEmail).

export function verifyEmail(token: string) {
  return api.post('/api/auth/verify-email/', { token })
}

export function resendVerification(email: string) {
  return api.post('/api/auth/resend-verification/', { email })
}

export function getVerificationLink() {
  return api.get('/api/auth/verification-link/')
}

export function getMe() {
  return api.get('/api/auth/me/')
}

export function patchMe(payload: Record<string, unknown>) {
  return api.patch('/api/auth/me/', payload)
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('avatar', file)
  return api.put('/api/auth/avatar/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export function removeAvatar() {
  return api.delete('/api/auth/avatar/')
}
