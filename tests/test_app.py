import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    original_state = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original_state))


def test_get_activities_returns_expected_payload():
    response = client.get("/activities")
    assert response.status_code == 200
    payload = response.json()

    assert "Chess Club" in payload
    assert isinstance(payload["Chess Club"]["participants"], list)
    assert payload["Chess Club"]["description"].startswith("Learn")


def test_signup_new_participant_success():
    activity = "Chess Club"
    new_email = "newstudent@mergington.edu"

    response = client.post(
        f"/activities/{activity}/signup",
        params={"email": new_email},
    )

    assert response.status_code == 200
    response_body = response.json()
    assert response_body == {
        "message": f"Signed up {new_email} for {activity}"
    }
    assert new_email in activities[activity]["participants"]


def test_signup_duplicate_participant_rejected():
    activity = "Chess Club"
    existing_email = activities[activity]["participants"][0]

    response = client.post(
        f"/activities/{activity}/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_remove_participant_success():
    activity = "Chess Club"
    existing_email = activities[activity]["participants"][0]

    response = client.delete(
        f"/activities/{activity}/participants/{existing_email}"
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {existing_email} from {activity}"
    assert existing_email not in activities[activity]["participants"]


def test_remove_nonexistent_participant_returns_404():
    activity = "Chess Club"
    response = client.delete(
        f"/activities/{activity}/participants/nonexistent@mergington.edu"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found for this activity"


def test_remove_from_unknown_activity_returns_404():
    response = client.delete(
        "/activities/Unknown Club/participants/student@mergington.edu"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
