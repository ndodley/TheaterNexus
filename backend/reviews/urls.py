from django.urls import path
from .views import MovieReviewsListCreateView, MovieMyReviewsListView, MovieReviewSummaryView, MyReviewsListView, ReviewDetailView

urlpatterns = [
    path('movies/<int:movie_id>/', MovieReviewsListCreateView.as_view(), name='movie-reviews'),
    path('movies/<int:movie_id>/me/', MovieMyReviewsListView.as_view(), name='my-reviews-for-movie'),
    path('movies/<int:movie_id>/summary/', MovieReviewSummaryView.as_view(), name='movie-review-summary'),
    path('me/', MyReviewsListView.as_view(), name='my-reviews-list'),
    path('<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
