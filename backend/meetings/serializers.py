from rest_framework import serializers
from .models import Meeting, Summary, ActionItem

class ActionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionItem
        fields = ('id', 'description', 'assignee', 'due_date', 'completed')

class SummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Summary
        fields = ('id', 'summary_text', 'key_points', 'decisions', 'follow_ups', 'created_at')

class MeetingSerializer(serializers.ModelSerializer):
    summary = SummarySerializer(read_only=True)
    action_items = ActionItemSerializer(many=True, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Meeting
        fields = (
            'id', 
            'user', 
            'title', 
            'description', 
            'uploaded_file', 
            'notes', 
            'transcript_text', 
            'created_at', 
            'summary', 
            'action_items'
        )

class MeetingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ('id', 'title', 'description', 'uploaded_file', 'notes')

    def validate(self, attrs):
        uploaded_file = attrs.get('uploaded_file')
        notes = attrs.get('notes')
        if not uploaded_file and not notes:
            raise serializers.ValidationError("Either an uploaded transcript file or text notes must be provided.")
        return attrs
