# Fonts

## Anthropic Sans (`AnthropicSans-Variable.woff2`)

The official **Anthropic Sans** variable font — Claude/Anthropic's own typeface, used
across this site as the primary sans (`--font-sans`).

- **Source:** downloaded from the official Anthropic brand typography page,
  <https://brand.anthropic.com/typography> (the "Download and install the fonts…"
  link referenced in Claude's MCP Apps design guidelines,
  <https://claude.com/docs/connectors/building/mcp-apps/design-guidelines>).
  Original file: `AnthropicSansVariableVariable-TextRegular.ttf` (variable TTF),
  hosted on the brand site's Firebase storage. Converted to WOFF2 with `fonttools`
  for web delivery.
- **Variable axes:** weight `wght` 300–800, optical size `opsz` 16–48. One file
  covers Light→Extrabold and both Text/Display optical sizes.
- **Copyright:** © 2025–2026 Anthropic PBC. Foundry: BSPK LLC. `fsType = 0`
  (installable embedding permitted).

### Licensing note

Anthropic offers these fonts for **local development** but has **not** granted a
general third-party commercial license. This is a personal academic homepage
(non-commercial), which is why it's used here. It should **not** be reused in an
unrelated commercial product. See the brand page above for terms.

### On the serif

Claude/Anthropic pairs Anthropic Sans with an **Anthropic Serif** in *marketing*,
but that serif is **not publicly downloadable**, and Claude's official product
design tokens define only `font-sans` (Anthropic Sans) and `font-mono` — there is
**no serif token**. Claude's actual product UI is Anthropic Sans + monospace.
So this site uses Anthropic Sans everywhere and does **not** use a serif — that is
the faithful match to Claude's real interface.
