import os
import json
import logging
from google import genai
from google.genai import types
from django.db import transaction
from .models import Summary, ActionItem

logger = logging.getLogger(__name__)

def generate_meeting_summary(meeting):
    """
    Connects to the Google Gemini API (using the new google-genai SDK), 
    gets a structured summary of the meeting, and populates the Summary 
    and ActionItem tables in an atomic transaction.
    """
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logger.warning("GEMINI_API_KEY environment variable is not set. Generating fallback summary.")
        _generate_mock_summary(meeting)
        return

    # Use the extracted transcript text
    transcript = meeting.transcript_text
    if not transcript or not transcript.strip():
        logger.warning(f"No transcript text available for meeting {meeting.id}. Generating empty summary.")
        _generate_empty_summary(meeting)
        return

    try:
        # Initialize Google GenAI client
        client = genai.Client(api_key=api_key)
        
        # Standard robust model for processing text transcripts
        model_name = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')

        prompt = f"""
You are an expert executive assistant. Analyze the following meeting transcript/notes and extract:
1. A concise, professional summary of the overall meeting.
2. A list of key discussion points.
3. A list of decisions made during the meeting.
4. A list of follow-up tasks.
5. A list of specific action items, including the description, the assignee (who is responsible, or null if unknown), and a due date (in YYYY-MM-DD format if mentioned, otherwise null).

Format your entire response as a single valid JSON object. Do not include markdown formatting like ```json or any other text before/after the JSON block.
The JSON structure MUST be exactly as follows:
{{
  "summary_text": "A paragraph summarizing the meeting.",
  "key_points": [
    "Discussion point 1",
    "Discussion point 2"
  ],
  "decisions": [
    "Decision 1",
    "Decision 2"
  ],
  "follow_ups": [
    "Follow-up task 1",
    "Follow-up task 2"
  ],
  "action_items": [
    {{
      "description": "Action description",
      "assignee": "Name or null",
      "due_date": "YYYY-MM-DD or null"
    }}
  ]
}}

Transcript:
\"\"\"
{transcript}
\"\"\"
"""
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Load and parse JSON data
        data = json.loads(response.text)
        
        # Save to database in an atomic transaction
        with transaction.atomic():
            # Clean existing summaries/actions if retrying
            Summary.objects.filter(meeting=meeting).delete()
            ActionItem.objects.filter(meeting=meeting).delete()

            summary_text = data.get('summary_text', 'No summary generated.')
            key_points = "\n".join([f"- {p}" for p in data.get('key_points', [])])
            decisions = "\n".join([f"- {d}" for d in data.get('decisions', [])])
            follow_ups = "\n".join([f"- {f}" for f in data.get('follow_ups', [])])

            Summary.objects.create(
                meeting=meeting,
                summary_text=summary_text,
                key_points=key_points,
                decisions=decisions,
                follow_ups=follow_ups
            )

            for item in data.get('action_items', []):
                desc = item.get('description')
                if desc:
                    due_date = item.get('due_date')
                    # Sanitize empty string or null string due_date from API output
                    if due_date in ["null", "None", "", None]:
                        due_date = None
                    
                    assignee = item.get('assignee')
                    if assignee in ["null", "None", ""]:
                        assignee = None

                    ActionItem.objects.create(
                        meeting=meeting,
                        description=desc,
                        assignee=assignee,
                        due_date=due_date,
                        completed=False
                    )
        logger.info(f"Successfully generated Gemini summary for meeting: {meeting.id}")

    except Exception as e:
        logger.error(f"Error in Gemini summary generation: {str(e)}")
        # Fail gracefully by generating fallback mock contents so users can still view the record
        _generate_mock_summary(meeting, error_message=str(e))

def _generate_mock_summary(meeting, error_message=None):
    with transaction.atomic():
        Summary.objects.filter(meeting=meeting).delete()
        ActionItem.objects.filter(meeting=meeting).delete()

        error_note = f"\n\n(Note: Gemini API failed. Reason: {error_message})" if error_message else "\n\n(Note: GEMINI_API_KEY was not configured in settings/env. Using local fallback generation.)"
        
        Summary.objects.create(
            meeting=meeting,
            summary_text=f"This is an offline/fallback summary for: '{meeting.title}'.{error_note}",
            key_points="- Analyzed uploaded meeting notes\n- Highlighted primary project discussions",
            decisions="- Set up local SQLite database connection\n- Structured React front-end application layout",
            follow_ups="- Integrate actual Google Gemini API credentials in .env\n- Setup production PostgreSQL databases"
        )

        ActionItem.objects.create(
            meeting=meeting,
            description="Configure GEMINI_API_KEY in the .env file to enable automated AI summary extraction.",
            assignee="System Admin",
            completed=False
        )

def _generate_empty_summary(meeting):
    with transaction.atomic():
        Summary.objects.filter(meeting=meeting).delete()
        ActionItem.objects.filter(meeting=meeting).delete()

        Summary.objects.create(
            meeting=meeting,
            summary_text="No transcript or meeting notes content was provided. Unable to generate a summary.",
            key_points="- No discussion points identified.",
            decisions="- No decisions recorded.",
            follow_ups="- No follow-up tasks."
        )
