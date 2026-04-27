# Daylog Golden Rules

These rules must never be broken. Check them before every modification.

## 1. No Future Blocks
No session block can ever exceed the current time (the "red line").
- Start and end times must always be `<= Date.now()`.
- If a session is active, its duration is calculated up to `now`, but it never goes beyond.
- Manual edits must be clamped to `now`.

## 2. No Overlapping Blocks
No two sessions (within the same task or across different tasks) can occupy the same time slot on the same day.
- Starting a new task must automatically stop any other active session at that exact same timestamp.
- Manual edits to start/end times must be validated or adjusted to prevent overlaps with existing sessions.
- In the Timeline, sessions should form a continuous or disconnected sequence, but never "stack" on top of each other.
