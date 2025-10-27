document.addEventListener('DOMContentLoaded', () => {
  // Get all new elements from popup.html
  const minInput = document.getElementById('interval_min');
  const secInput = document.getElementById('interval_sec');
  const goalInput = document.getElementById('goal_input'); // New goal input
  const setButton = document.getElementById('setReminder');
  const closeButton = document.getElementById('closeReminder');
  const confirmationMessage = document.getElementById('confirmationMessage');
  const currentReminderText = document.getElementById('currentReminder');
  const currentGoalText = document.getElementById('currentGoal'); // New goal status

  /**
   * Helper function to update the "Current Reminder" status text.
   */
  function updateCurrentReminderText(mins, secs) {
    // Check if mins or secs are valid numbers and greater than 0
    const validMins = Number.isInteger(mins) && mins > 0;
    const validSecs = Number.isInteger(secs) && secs > 0;

    if (validMins || validSecs) {
      currentReminderText.textContent = `Current: Every ${mins || 0}m ${secs || 0}s`;
    } else {
      currentReminderText.textContent = 'No reminder set.';
    }
  }

  /**
   * Helper function to update the "Current Goal" status text.
   */
  function updateCurrentGoalText(remaining, total) {
    if (Number.isInteger(remaining) && Number.isInteger(total) && total > 0) {
      currentGoalText.textContent = `Goal: ${remaining} / ${total} glasses left`;
    } else {
      currentGoalText.textContent = 'Goal: Not set.';
    }
  }

  // Load all saved data from chrome.storage when popup opens
  chrome.storage.local.get(
    ['interval_min', 'interval_sec', 'goal_total', 'goal_remaining'],
    (result) => {
      // Populate inputs with saved values or defaults
      minInput.value = result.interval_min || 5;
      secInput.value = result.interval_sec || 0;
      goalInput.value = result.goal_total || 10;

      // Update the status text based on loaded values
      updateCurrentReminderText(result.interval_min, result.interval_sec);
      updateCurrentGoalText(result.goal_remaining, result.goal_total);
    }
  );

  // When "Set Reminder" is clicked
  setButton.addEventListener('click', () => {
    const mins = parseInt(minInput.value) || 0;
    const secs = parseInt(secInput.value) || 0;
    const goal = parseInt(goalInput.value) || 0; // Read the goal
    const totalSeconds = (mins * 60) + secs;

    // Validation
    if (totalSeconds <= 0) {
      confirmationMessage.textContent = 'Please enter a valid time.';
      confirmationMessage.classList.remove('hidden');
      return;
    }
    if (goal <= 0) {
      confirmationMessage.textContent = 'Please enter a goal greater than 0.';
      confirmationMessage.classList.remove('hidden');
      return;
    }

    // Convert total seconds to (decimal) minutes for the alarm API
    const totalMinutes = Math.max(totalSeconds / 60.0, 0.0167);

    // Save all values to storage
    chrome.storage.local.set({
      interval_min: mins,
      interval_sec: secs,
      interval_total_minutes: totalMinutes,
      goal_total: goal,         // The total goal
      goal_remaining: goal      // The current count (resets to total)
    });

    // Clear any old alarm and create a new ONE-TIME alarm
    // The background script will "chain" this alarm to make it repeat
    chrome.alarms.clear('drinkWaterAlarm', () => {
      chrome.alarms.create('drinkWaterAlarm', {
        delayInMinutes: totalMinutes
      });
    });

    // Show confirmation and update status
    confirmationMessage.textContent = `Reminder set for ${mins}m ${secs}s!`;
    confirmationMessage.classList.remove('hidden');
    updateCurrentReminderText(mins, secs);
    updateCurrentGoalText(goal, goal); // Show new goal

    // Disable buttons to prevent multiple clicks
    setButton.disabled = true;
    closeButton.disabled = true;

  });

  // When "Close Reminder" is clicked
  closeButton.addEventListener('click', () => {
    // Clear the alarm
    chrome.alarms.clear('drinkWaterAlarm');

    // Remove all saved data from storage
    chrome.storage.local.remove([
      'interval_min', 'interval_sec', 'interval_total_minutes',
      'goal_total', 'goal_remaining'
    ]);

    // Show confirmation and update status
    confirmationMessage.textContent = 'Reminder cleared.';
    confirmationMessage.classList.remove('hidden');
    updateCurrentReminderText(0, 0); // Set status to "No reminder set"
    updateCurrentGoalText(null, null); // Set status to "Goal: Not set."

    // Disable buttons
    setButton.disabled = true;
    closeButton.disabled = true;

    // Close popup after 1.5 seconds
    setTimeout(() => {
      window.close();
    }, 1500);
  });
});

