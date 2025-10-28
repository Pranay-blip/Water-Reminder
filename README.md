Water Reminder - A CS50 Final Project
=====================================

Description
-----------

I spend several hours on my laptop all day, and I often get so focused on my work that hours pass without me drinking any water, leaving me tired and dehydrated. Which is why I created this "Water Reminder" Chrome Extension.

It's a complete, goal-oriented hydration tracking system. Users set a custom reminder interval (down to the second) and a daily goal (e.g., "8 glasses"). The extension then provides native desktop notifications at that interval, automatically counting down from the user's goal. Once the goal is met, the reminders stop for the day. The application is persistent, remembering the goal and timer even after a browser restart.

This extension was submitted as my final project for Harvard's CS50x, demonstrating state management, asynchronous programming, and UI design on a new platform.

Core Features
-------------

-   **Custom Timer:** Set a custom min/sec reminder interval.

-   **Daily Goal Tracking:** Track a daily goal that decrements with each reminder.

-   **Automatic Stop:** Automatically stops all reminders with a "Goal Complete!" notification.

-   **Native Notifications:** Provides native desktop notifications (Windows, macOS, etc.).

-   **Persistent State:** Persists goals and timers across browser restarts using `chrome.storage`.

-   **Clean, Responsive UI:** Clean, modern UI with clear user feedback and confirmation messages.

Getting Started
---------------

### Dependencies

Requires a Chromium-based browser (Chrome, Edge, etc.).

### Installing the extension

1.  Download the source code for this project as a ZIP file.

2.  Unzip the downloaded folder.

3.  In your browser, go to `chrome://extensions/`.

4.  Turn on "Developer Mode" (top-right corner).

5.  Click on "Load Unpacked" (top-left corner).

6.  Select the unzipped extension folder (the one containing `manifest.json`).

7.  Pin the "Water Reminder" extension from the puzzle-piece "Extensions" menu.

8.  Click the extension icon, set your "Today's Goal" and reminder interval, then click "Set Reminder".

You will now be reminded to stay hydrated based on your settings.

Technical Deep Dive & Design Choices
------------------------------------

This project is built from four main components: `manifest.json`, `popup.html`, `popup.js` (the "front-end"), and `background.js` (the "back-end").

### `manifest.json` (The Blueprint)

This file is the blueprint for the extension. The key permissions requested are: `"alarms"` for Chrome's high-priority alarm API (more reliable than `setTimeout`), `"notifications"` for creating native desktop notifications, and `"storage"` for using `chrome.storage.local` as a persistent, asynchronous key-value database.

### `popup.html` & `popup.js` (The "Front-End")

`popup.html` lays out the UI structure (inputs, status text) and includes all CSS in a `<style>` tag for self-containment. `popup.js` handles all UI logic. When "Set Reminder" is clicked, it validates the inputs, calculates the total interval in *decimal minutes* (required by the `chrome.alarms` API, e.g., 90s = `1.5`m), saves all state data (`goal_total`, `goal_remaining`, etc.) to `chrome.storage`, and creates the first `drinkWaterAlarm`.

### `background.js` (The "Back-End" Service Worker)

This is the most complex and critical file, running as an event-driven service worker.

#### 1\. The "Chaining Alarm" Logic

A key design choice was handling second-level precision. The `chrome.alarms` API disallows *repeating* alarms under one minute. To solve this, I implemented a "chaining" alarm: the application creates a *single, one-time* alarm. When it fires, the `background.js` listener performs its task and then (if the goal is not met) **creates the** ***next*** **one-time alarm**. This chain allows for any interval, no matter how short.

#### 2\. State Management and Goal Decrementing

When the `drinkWaterAlarm` listener fires, it executes the core logic:
1. It retrieves the current state (`goal_remaining`) from storage.

2. It checks if the goal is `0` or less, stopping the
chain and cleaning up storage if true.

3. It decrements `goal_remaining` by 1.

4. If the new goal is `0`, it shows a "Goal Complete!" notification and cleans up all alarms.

5. If the new goal is greater than `0`, it saves the new count, shows a progress notification, and schedules the next alarm in the chain.

#### 3\. Solving a Race Condition

A significant bug was discovered: a race condition. If the user clicked "Close Reminder" *at the exact moment* the background script was processing an alarm, a "ghost" alarm could be created. The `popup.js` script would correctly clear the storage. However, the `background.js` script, which was already running, would finish its logic and schedule the next alarm, completely unaware of the cancellation. The solution was to add a final check. *Right before* scheduling the next alarm, the script performs one last, critical `chrome.storage.local.get(['interval_total_minutes'])`. If this value is now `undefined` (because the popup cleared it), the script knows not to schedule the next alarm, successfully breaking the chain.

Help
----

You can reach out to me if you have any questions at [pranaypandey807@gmail.com](mailto:pranaypandey807@gmail.com).

Author
------

`Pranay Pandey` (`@Pranay-blip`)

Version History
---------------

-   1.0

    -   Initial Release
