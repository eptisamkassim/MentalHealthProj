import json
from unittest.mock import MagicMock, patch
from app.services.gpt_service import GPTService


def _mock_completion(content: str):
    """Build a minimal OpenAI-shaped response object."""
    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]
    return response


class TestExtractPreferences:
    def test_returns_parsed_json(self):
        svc = GPTService.__new__(GPTService)
        payload = {
            "insurance": "Aetna",
            "therapy_type": "CBT",
            "concerns": ["anxiety", "sleep"],
            "location": "Boston",
            "availability": "weekends",
        }
        svc.client = MagicMock()
        svc.client.chat.completions.create.return_value = _mock_completion(json.dumps(payload))

        result = svc.extract_preferences([{"role": "user", "content": "I have Aetna"}])

        assert result["insurance"] == "Aetna"
        assert result["therapy_type"] == "CBT"
        assert "anxiety" in result["concerns"]

    def test_returns_empty_dict_on_invalid_json(self):
        svc = GPTService.__new__(GPTService)
        svc.client = MagicMock()
        svc.client.chat.completions.create.return_value = _mock_completion("not json at all")

        result = svc.extract_preferences([])

        assert result == {}

    def test_all_null_preferences(self):
        svc = GPTService.__new__(GPTService)
        payload = {"insurance": None, "therapy_type": None, "concerns": [], "location": None, "availability": None}
        svc.client = MagicMock()
        svc.client.chat.completions.create.return_value = _mock_completion(json.dumps(payload))

        result = svc.extract_preferences([])

        assert result["concerns"] == []
        assert result["insurance"] is None
