from django.utils import timezone
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ShowTime
from .serializers import ShowTimeSerializer, SeatSerializer


class ShowTimeViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = ShowTime.objects.select_related('movie', 'screen', 'screen__theater')
	serializer_class = ShowTimeSerializer

	def get_queryset(self):
		qs = super().get_queryset()
		params = self.request.query_params

		movie = params.get('movie')
		theater = params.get('theater')
		screen = params.get('screen')
		status = params.get('status')
		date = params.get('date')  # YYYY-MM-DD
		start_from = params.get('from')  # ISO datetime
		end_to = params.get('to')  # ISO datetime
		upcoming = params.get('upcoming')

		if movie:
			qs = qs.filter(movie_id=movie)
		if theater:
			qs = qs.filter(screen__theater_id=theater)
		if screen:
			qs = qs.filter(screen_id=screen)
		if status:
			qs = qs.filter(status=status)
		if upcoming == 'true':
			qs = qs.filter(start_time__gte=timezone.now())
		if date:
			try:
				from datetime import datetime, timedelta
				d = datetime.fromisoformat(date)
				start = timezone.make_aware(datetime(d.year, d.month, d.day, 0, 0, 0))
				end = start + timedelta(days=1)
				qs = qs.filter(start_time__gte=start, start_time__lt=end)
			except Exception:
				pass
		if start_from:
			try:
				from datetime import datetime
				dt = timezone.make_aware(datetime.fromisoformat(start_from))
				qs = qs.filter(start_time__gte=dt)
			except Exception:
				pass
		if end_to:
			try:
				from datetime import datetime
				dt = timezone.make_aware(datetime.fromisoformat(end_to))
				qs = qs.filter(end_time__lte=dt)
			except Exception:
				pass

		return qs

	@action(detail=False, methods=['get'], url_path='by-movie/(?P<movie_id>[^/.]+)')
	def by_movie(self, request, movie_id=None):
		qs = self.get_queryset().filter(movie_id=movie_id).order_by('start_time')
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	@action(detail=True, methods=['get'])
	def seats(self, request, pk=None):
		showtime = self.get_object()
		seats_qs = showtime.screen.seats.all().order_by('row', 'number')
		data = SeatSerializer(seats_qs, many=True).data
		return Response({
			'showtime': ShowTimeSerializer(showtime).data,
			'seats': data,
		})

