from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Genre, Movie
from .serializers import GenreSerializer, MovieSerializer


class GenreViewSet(viewsets.ModelViewSet):
	queryset = Genre.objects.all()
	serializer_class = GenreSerializer
	http_method_names = ["get", "post", "head", "options"]


class MovieViewSet(viewsets.ModelViewSet):
	queryset = Movie.objects.select_related().prefetch_related("genres")
	serializer_class = MovieSerializer
	http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
	filter_backends = [filters.SearchFilter]
	search_fields = ["title", "plot_summary"]

	def get_queryset(self):
		qs = super().get_queryset()
		genre = self.request.query_params.get("genre")
		status = self.request.query_params.get("status")
		if genre:
			qs = qs.filter(genres__name__iexact=genre)
		if status:
			qs = qs.filter(availability_status=status)
		return qs

	@action(detail=False, methods=["get"]) 
	def now_showing(self, request):
		qs = self.get_queryset().filter(availability_status=Movie.Availability.NOW_SHOWING)
		return Response(self.get_serializer(qs, many=True).data)
        
