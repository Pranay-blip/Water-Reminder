/**
 * Listener for when an alarm goes off.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'drinkWaterAlarm') {
    return;
  }

  // Get the current state from storage
  chrome.storage.local.get(
    ['interval_total_minutes', 'goal_remaining', 'goal_total'],
    (result) => {

      let remaining = result.goal_remaining;

      // If goal isn't set or is already 0, stop everything.
      if (typeof remaining !== 'number' || remaining <= 0) {
        chrome.alarms.clear('drinkWaterAlarm');
        chrome.storage.local.remove([
          'interval_min', 'interval_sec', 'interval_total_minutes',
          'goal_total', 'goal_remaining'
        ]);
        return;
      }

      // Decrement the goal
      remaining -= 1;

      // Check if this was the LAST glass
      if (remaining <= 0) {
        // Goal complete! Show final notification.
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'Goal Complete!',
          message: `You did it! You drank all ${result.goal_total} glasses.`,
          priority: 2
        });

        // Clean up storage and clear the alarm (which stops the chain)
        chrome.alarms.clear('drinkWaterAlarm');
        chrome.storage.local.remove([
          'interval_min', 'interval_sec', 'interval_total_minutes',
          'goal_total', 'goal_remaining'
        ]);

      } else {
        // Goal not complete, save the new remaining count
        chrome.storage.local.set({ goal_remaining: remaining });

        // Show a standard notification with progress
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'Time to Drink Water!',
          message: `Stay hydrated! ${remaining} glasses to go.`,
          priority: 2
        });

        chrome.storage.local.get(['interval_total_minutes'], (fresh_result) => {
          if (fresh_result.interval_total_minutes) {
            chrome.alarms.create('drinkWaterAlarm', {
              delayInMinutes: fresh_result.interval_total_minutes
            });
          }
        });
      }
    }
  );
});

/**
 * Listener for when Chrome first starts up.
 * This ensures the reminder chain continues even after a browser restart.
 */
chrome.runtime.onStartup.addListener(() => {
  // Check if an alarm and goal were set
  chrome.storage.local.get(
    ['interval_total_minutes', 'goal_remaining'],
    (result) => {
      // Only restart the alarm chain if there is an interval AND a goal still to meet
      if (result.interval_total_minutes && result.goal_remaining > 0) {
        // Create the alarm to fire at its next scheduled time
        chrome.alarms.create('drinkWaterAlarm', {
          delayInMinutes: result.interval_total_minutes
        });
      }
    }
  );
});

