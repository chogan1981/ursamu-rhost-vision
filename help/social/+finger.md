# +FINGER

View a player's public profile.

## Syntax

`+finger` `+finger <player>`

## Description

Displays a player's public profile card. Defaults to your own profile if no
name is given. The target must be currently connected.

Output includes alias, idle time, total connection time, money, short
description, doing message, and biography text.

## Setting your profile

| Attribute         | Command                   | Shown in       |
|-------------------|---------------------------|----------------|
| Short description | `&short-desc me=<text>`   | +finger, look  |
| Doing message     | `@doing <text>`           | +finger, who   |
| Biography         | `&finger-info me=<text>`  | +finger only   |

The `&finger-info` text is word-wrapped to fit the reader's terminal width.

## Related

`help +where` `help +staff` `help score`

## Example

`+finger` `+finger Jupiter`
