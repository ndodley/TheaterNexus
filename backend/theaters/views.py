from django.shortcuts import render
from rest_framework import viewsets, filters
from .models import Theater, Screen, Seat
from .serializers import TheaterSerializer, ScreenSerializer, SeatSerializer


class TheaterViewSet(viewsets.ModelViewSet):
	queryset = Theater.objects.all()
	serializer_class = TheaterSerializer
	http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
	filter_backends = [filters.SearchFilter]
	search_fields = ["name"]


class ScreenViewSet(viewsets.ModelViewSet):
	queryset = Screen.objects.select_related("theater").prefetch_related("seats")
	serializer_class = ScreenSerializer
	http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
	filter_backends = [filters.SearchFilter]
	search_fields = ["name", "theater__name"]

	def get_queryset(self):
		qs = super().get_queryset()
		theater_id = self.request.query_params.get("theater")
		if theater_id:
			qs = qs.filter(theater_id=theater_id)
		return qs


class SeatViewSet(viewsets.ModelViewSet):
	queryset = Seat.objects.select_related("screen", "screen__theater")
	serializer_class = SeatSerializer
	http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

	def get_queryset(self):
		qs = super().get_queryset()
		screen_id = self.request.query_params.get("screen")
		if screen_id:
			qs = qs.filter(screen_id=screen_id)
		return qs

# Create your views here.
