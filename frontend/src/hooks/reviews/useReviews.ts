import { useEffect, useState } from 'react'
import { getMovieReviews, getMovieReviewSummary, createReview, updateReview, deleteReview as deleteReviewApi } from '../../api/reviews'
import type { Review, ReviewSummary } from '../../types'

/**
 * All review CRUD for one movie: the list+summary fetch, create/update/delete
 * mutations, and the draft ("new review") / edit form state, moved out of
 * MovieDetailsPage as-is. (Renamed from useMovieReviews -- shorter. Not
 * to be confused with useMyReviews, which is the signed-in user's own
 * review list on the My Reviews page -- this hook is scoped to one movie's
 * reviews, used by MovieDetailsPage.)
 */
export function useReviews(id: string | undefined, isAuthenticated: boolean) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [draftRating, setDraftRating] = useState<number>(5)
  const [draftTitle, setDraftTitle] = useState<string>('')
  const [draftContent, setDraftContent] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState<number>(5)
  const [editTitle, setEditTitle] = useState<string>('')
  const [editContent, setEditContent] = useState<string>('')

  // Load reviews list and summary
  useEffect(() => {
    if (!id) return
    getMovieReviews(id).then(res => setReviews(res.data)).catch(() => setReviews([]))
    getMovieReviewSummary(id).then(res => setSummary(res.data)).catch(() => setSummary({ movie_id: Number(id), average_rating: 0, count: 0 }))
  }, [id])

  async function refreshReviews() {
    if (!id) return
    const list = await getMovieReviews(id)
    setReviews(list.data)
    const s = await getMovieReviewSummary(id)
    setSummary(s.data)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !isAuthenticated) return
    setSubmitting(true)
    try {
      await createReview(id, { rating: draftRating, title: draftTitle, content: draftContent })
      await refreshReviews()
      setDraftRating(5)
      setDraftTitle('')
      setDraftContent('')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteReview(reviewId: number) {
    if (!id || !isAuthenticated) return
    setSubmitting(true)
    try {
      await deleteReviewApi(reviewId)
      await refreshReviews()
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(rv: Review) {
    setEditingId(rv.id)
    setEditRating(rv.rating)
    setEditTitle(rv.title || '')
    setEditContent(rv.content || '')
  }

  async function saveEdit(reviewId: number) {
    if (!id || !isAuthenticated || !editingId) return
    setSubmitting(true)
    try {
      await updateReview(reviewId, { rating: editRating, title: editTitle, content: editContent })
      await refreshReviews()
      setEditingId(null)
    } finally {
      setSubmitting(false)
    }
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return {
    reviews,
    summary,
    draftRating, setDraftRating,
    draftTitle, setDraftTitle,
    draftContent, setDraftContent,
    submitting,
    editingId,
    editRating, setEditRating,
    editTitle, setEditTitle,
    editContent, setEditContent,
    submitReview,
    deleteReview,
    startEdit,
    saveEdit,
    cancelEdit,
  }
}
