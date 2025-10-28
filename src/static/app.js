document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      const previousSelection = activitySelect.value;
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("p");
        participantsHeader.innerHTML = "<strong>Current Participants:</strong>";
        participantsSection.appendChild(participantsHeader);

        if (details.participants.length > 0) {
          const list = document.createElement("ul");
          list.className = "participants-list";

          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-participant";
            deleteButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
            deleteButton.innerHTML = "&times;";
            deleteButton.addEventListener("click", () =>
              handleParticipantRemoval(name, participant, deleteButton)
            );

            listItem.appendChild(participantEmail);
            listItem.appendChild(deleteButton);
            list.appendChild(listItem);
          });

          participantsSection.appendChild(list);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No participants yet";
          participantsSection.appendChild(noParticipants);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === previousSelection) {
          option.selected = true;
        }
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleParticipantRemoval(activityName, email, triggerButton) {
    triggerButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to remove participant.", "error");
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      showMessage("Failed to remove participant. Please try again.", "error");
    } finally {
      triggerButton.disabled = false;
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    if (!activity) {
      showMessage("Please select an activity.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to sign up. Please try again.", "error");
    }
  });

  // Initialize app
  fetchActivities();
});
