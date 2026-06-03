from django.db import models
from django.contrib.auth.models import User

class Meeting(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meetings')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    uploaded_file = models.FileField(upload_to='transcripts/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)  # Copied/pasted meeting notes
    transcript_text = models.TextField(blank=True, null=True)  # Extracted text from uploaded file or notes
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.username})"

class Summary(models.Model):
    meeting = models.OneToOneField(Meeting, on_delete=models.CASCADE, related_name='summary')
    summary_text = models.TextField()
    key_points = models.TextField(blank=True, null=True)  # Extracted key discussion points (JSON or structured text)
    decisions = models.TextField(blank=True, null=True)  # Decisions made during the meeting
    follow_ups = models.TextField(blank=True, null=True)  # Follow-up tasks/actions
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Summary for {self.meeting.title}"

class ActionItem(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='action_items')
    description = models.TextField()
    assignee = models.CharField(max_length=255, blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Action Item for {self.meeting.title}: {self.description[:30]}"

