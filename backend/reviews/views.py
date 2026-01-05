from django.db.models import Avg, Count
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Review
from .serializers import ReviewSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class MovieReviewsListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        movie_id = self.kwargs.get('movie_id')
        return Review.objects.filter(movie_id=movie_id).select_related('user', 'movie').order_by('-created_at')

    def perform_create(self, serializer):
        movie_id = self.kwargs.get('movie_id')
        serializer.save(user=self.request.user, movie_id=movie_id)


class MyReviewRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_object(self):
        movie_id = self.kwargs.get('movie_id')
        return Review.objects.select_related('user', 'movie').get(movie_id=movie_id, user=self.request.user)


class MovieReviewSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, movie_id):
        agg = Review.objects.filter(movie_id=movie_id).aggregate(avg=Avg('rating'), count=Count('id'))
        return Response({'movie_id': movie_id, 'average_rating': agg['avg'] or 0, 'count': agg['count'] or 0})


class MyReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related('movie').order_by('-updated_at')
from django.shortcuts import render

# Create your views here.
