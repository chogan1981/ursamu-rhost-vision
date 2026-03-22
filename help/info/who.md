# WHO

List all connected players.

## Syntax

`who`

## Description

Shows every connected (non-dark) player sorted by most recent login.

| Column      | Description                              |
|-------------|------------------------------------------|
| Player Name | Display name or moniker                  |
| On For      | Total time connected (HH:MM or Xd HH:MM) |
| Idle        | Time since last command (color-coded)    |
| Doing       | Player's `@doing` message                |

Idle color coding:

- Green: idle less than 5 minutes
- Normal: idle 5–14 minutes
- Dark gray: idle 15+ minutes

## Related

`help +where` `help +staff` `@doing <text>` — set your Doing message

## Example

`who`
