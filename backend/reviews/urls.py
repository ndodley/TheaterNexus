from django.urls import path
from .views import MovieReviewsListCreateView, MyReviewRetrieveUpdateDeleteView, MovieReviewSummaryView, MyReviewsListView


urlpatterns = [
    path('movies/<int:movie_id>/', MovieReviewsListCreateView.as_view(), name='movie-reviews'),
    path('movies/<int:movie_id>/me/', MyReviewRetrieveUpdateDeleteView.as_view(), name='my-review'),
    path('movies/<int:movie_id>/summary/', MovieReviewSummaryView.as_view(), name='movie-review-summary'),
    path('me/', MyReviewsListView.as_view(), name='my-reviews-list'),
]
