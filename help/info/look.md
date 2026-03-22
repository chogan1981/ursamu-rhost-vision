# LOOK

Examine the current room or a specific object.

## Syntax

`look` `look <object>`

## Description

Shows the room name, description, players, contents, and exits of your current
location. If an object name is given, shows that object's description instead.

**Players** section lists everyone in the room with idle-time color coding and
their `&short-desc` (if set).

- Green: idle less than 5 minutes
- Normal: idle 5–14 minutes
- Dark gray: idle 15+ minutes

**Exits** are split into two groups:

- *Locations* — named destinations (e.g. "Market", "Inn")
- *Directions* — compass words (north, south, ne, up, in, …)

Exit aliases appear in parentheses: `Market (m)`

When you look at an object (not a room), the room sees your `ODESC` message
if one is set on that object.

## Player attributes

`&short-desc me=<text>` — description shown next to your name in rooms

## Related

`help score` `help inventory` `help examine`

## Example

`look` `look box` `look north`
