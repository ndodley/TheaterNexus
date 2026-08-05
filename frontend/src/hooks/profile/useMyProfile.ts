import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.tsx'
import { imageUrl } from '../../api/index.ts'
import { getMe, patchMe, uploadAvatar, removeAvatar } from '../../api/auth.ts'

/**
 * All profile state for MyProfilePage, moved out as-is: the profile record
 * itself, the edit form, the avatar upload/remove flow, and the initial
 * `getMe()` load (which — like the original — only runs while signed in).
 */
export function useMyProfile() {
  const { user, refreshMe } = useAuth()
  const [profile, setProfile] = useState(user || null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: (user?.date_of_birth || '') as string,
  })

  const avatarSrc = profile?.avatar_url ? imageUrl(profile.avatar_url) : (profile?.avatar ? imageUrl(profile.avatar) : imageUrl('/media/default_poster/default_avatar.jpg'))

  async function loadMe() {
    try {
      const { data } = await getMe()
      setProfile(data)
      setForm({
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        phone_number: data?.phone_number || '',
        date_of_birth: (data?.date_of_birth || '') as string,
      })
    } catch {}
  }

  async function onUploadAvatar(file: File) {
    setUploading(true)
    try {
      await uploadAvatar(file)
      await loadMe()
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  async function onRemoveAvatar() {
    setUploading(true)
    try {
      await removeAvatar()
      await loadMe()
      await refreshMe()
    } finally {
      setUploading(false)
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth || null,
      }
      const { data } = await patchMe(payload)
      setProfile(data)
      setEditing(false)
      await refreshMe()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // Original page only reached this useEffect while signed in (it sat
    // after an early `if (!user) return` in the component body); guard the
    // body here so behavior is unchanged for the signed-out case.
    if (!user) return
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEditing() {
    setEditing(true)
    setError(null)
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
    setForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone_number: profile?.phone_number || '',
      date_of_birth: (profile?.date_of_birth || '') as string,
    })
  }

  return {
    user,
    profile,
    editing,
    saving,
    uploading,
    error,
    form,
    setForm,
    avatarSrc,
    onUploadAvatar,
    onRemoveAvatar,
    onSaveProfile,
    startEditing,
    cancelEditing,
  }
}
