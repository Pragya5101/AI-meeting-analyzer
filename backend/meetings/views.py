from rest_framework import viewsets, permissions, serializers, status, filters
from rest_framework.response import Response
from .models import Meeting, Summary, ActionItem
from .serializers import MeetingSerializer, MeetingCreateSerializer, ActionItemSerializer
from .utils import extract_text_from_file
from .services import generate_meeting_summary
import logging

logger = logging.getLogger(__name__)

class MeetingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'transcript_text']

    def get_queryset(self):
        # Only return meetings owned by the authenticated user
        return Meeting.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return MeetingCreateSerializer
        return MeetingSerializer

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('uploaded_file')
        notes = serializer.validated_data.get('notes', '')
        transcript_text = ""

        if uploaded_file:
            try:
                transcript_text = extract_text_from_file(uploaded_file)
            except Exception as e:
                logger.error(f"Error parsing uploaded file: {str(e)}")
                raise serializers.ValidationError({"uploaded_file": f"Failed to extract text from file: {str(e)}"})
        elif notes:
            transcript_text = notes

        # Save the meeting with user and extracted transcript text
        meeting = serializer.save(user=self.request.user, transcript_text=transcript_text)

        # Trigger summary generation service (runs synchronously or as background process)
        try:
            generate_meeting_summary(meeting)
        except Exception as e:
            logger.error(f"Failed to generate summary: {str(e)}")
            # For resilience, we save the meeting anyway even if AI fails, so the user can retry.

    def create(self, request, *args, **kwargs):
        # Override create to return the full serialized meeting including the generated summary
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Fetch the complete meeting instance with the newly created summary
        meeting_instance = Meeting.objects.get(id=serializer.instance.id)
        response_serializer = MeetingSerializer(meeting_instance)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class ActionItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActionItemSerializer

    def get_queryset(self):
        # Only return action items for meetings owned by the authenticated user
        return ActionItem.objects.filter(meeting__user=self.request.user)

    def update(self, request, *args, **kwargs):
        # Allow partial updates to toggle 'completed'
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
