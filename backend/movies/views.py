from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Genre, Movie
from .serializers import GenreSerializer, MovieSerializer


class GenreViewSet(viewsets.ModelViewSet):
	queryset = Genre.objects.all()
	serializer_class = GenreSerializer
	http_method_names = ["get", "post", "head", "options"]
	permission_classes = [AllowAny]
	authentication_classes = []


class MovieViewSet(viewsets.ModelViewSet):
	queryset = Movie.objects.select_related().prefetch_related("genres")
	serializer_class = MovieSerializer
	http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["title", "plot_summary"]
	ordering_fields = ["release_date", "rating_average", "title", "duration_minutes", "created_at"]
	ordering = ["-release_date", "title"]
	permission_classes = [AllowAny]
	authentication_classes = []

	def get_queryset(self):
		qs = super().get_queryset()
		params = self.request.query_params

		# Text search: support DRF's ?search=... and an alias ?q=...
		q_term = params.get("q")
		if q_term and not params.get("search"):
			qs = qs.filter(Q(title__icontains=q_term) | Q(plot_summary__icontains=q_term))

		# Availability: single or multiple
		status = params.get("status")
		statuses = params.get("statuses")
		if status:
			qs = qs.filter(availability_status=status)
		elif statuses:
			qs = qs.filter(availability_status__in=[s.strip() for s in statuses.split(",") if s.strip()])

		# Genres: by name(s) or id(s)
		genre = params.get("genre")
		genres = params.get("genres")
		genre_ids = params.get("genre_ids")
		if genre:
			qs = qs.filter(genres__name__iexact=genre)
		if genres:
			names = [g.strip() for g in genres.split(',') if g.strip()]
			if names:
				qs = qs.filter(genres__name__in=names)
		if genre_ids:
			try:
				ids = [int(x) for x in genre_ids.split(',') if x.strip()]
				if ids:
					qs = qs.filter(genres__id__in=ids)
			except ValueError:
				pass

		# Duration range
		dmin = params.get("duration_min")
		dmax = params.get("duration_max")
		if dmin:
			try:
				qs = qs.filter(duration_minutes__gte=int(dmin))
			except ValueError:
				pass
		if dmax:
			try:
				qs = qs.filter(duration_minutes__lte=int(dmax))
			except ValueError:
				pass

		# Rating range
		rmin = params.get("rating_min")
		rmax = params.get("rating_max")
		if rmin:
			try:
				qs = qs.filter(rating_average__gte=float(rmin))
			except ValueError:
				pass
		if rmax:
			try:
				qs = qs.filter(rating_average__lte=float(rmax))
			except ValueError:
				pass

		# Release year exact or range
		year = params.get("year")
		ymin = params.get("year_min")
		ymax = params.get("year_max")
		if year:
			try:
				qs = qs.filter(release_date__year=int(year))
			except ValueError:
				pass
		else:
			if ymin:
				try:
					qs = qs.filter(release_date__year__gte=int(ymin))
				except ValueError:
					pass
			if ymax:
				try:
					qs = qs.filter(release_date__year__lte=int(ymax))
				except ValueError:
					pass

		# Poster presence filter: has_poster=true excludes the shared default
		has_poster = params.get("has_poster")
		if has_poster in {"1", "true", "True", "yes"}:
			qs = qs.exclude(image__isnull=True).exclude(image="default_poster/default_movie.jpg")

		# If we filtered by M2M, avoid duplicates
		return qs.distinct()

	@action(detail=False, methods=["get"]) 
	def now_showing(self, request):
		qs = self.get_queryset().filter(availability_status=Movie.Availability.NOW_SHOWING)
		return Response(self.get_serializer(qs, many=True).data)
        
