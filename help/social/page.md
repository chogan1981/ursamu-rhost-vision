# PAGE

Send a private message to another player.

## Syntax

`page <player>=<message>` `p <player>=<message>`

`page <player>=:<pose>` — send a pose page

## Description

Sends a private message regardless of location. The target must be connected
and not dark.

**Normal page:**

```
Jupiter(J) pages: Hello there!
You paged Jupiter with 'Hello there!'.
```

**Pose page** (prefix with `:`):

```
From afar, Jupiter(J) waves to you.
Long distance to Jupiter: Jupiter waves to you.
```

The sender's alias (set with `&alias me=<letter>`) appears in parentheses.

## Related

`help +finger` `help say` `help pose`

## Example

`page Bob=Are you busy?`
`page Bob=:waves hello.`
