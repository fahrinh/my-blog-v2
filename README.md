# fahri.blog

Source of [fahri.blog](https://fahri.blog), built with
[Lume](https://lume.land) and the [Xeo](https://lume.land/theme/xeo/) theme.
English is served from `/`, Indonesian from `/id/`.

## Requirements

- [Deno](https://deno.com) 2.x

## Commands

```sh
deno task serve   # local dev server with live reload + CMS at /admin
deno task build   # production build into _site/
deno task prod    # build with the production location
LUME_DRAFTS=true deno task build   # include draft posts
deno task new     # create a new post
```

## Editing content with Lume CMS

The CMS is configured in `_cms.ts` and is only loaded by the dev server, never
by `deno task build`.

```sh
deno task serve
# open http://localhost:3000/admin
```

From the admin you can:

- edit the home page text, menu links, meta tags, analytics and Giscus settings
  (`_data.yml`);
- create, edit and delete blog posts in `posts/`;
- edit extra pages in `pages/` and the About page;
- upload images to `images/`.

Changes are written straight to the Markdown/YAML files, and the preview
iframe reloads the local site. Commit the changes with Git as usual.

Notes:

- The dev server enables drafts (`LUME_DRAFTS=true`), so draft posts are
  editable and previewable. A normal build excludes them.
- The CMS writes `date` values with the `+07:00` offset used by this blog.
- `id` links translations: two posts with the same `id` (one `en`, one `id`)
  are treated as translations of each other.
- The `src` storage is the repository root, so paths in `_cms.ts` are relative
  to it (`src:posts/*.md`, `src:_data.yml`, ...).

The site location (`https://fahri.blog`) is set in `_config.ts`, so
`deno task build` already produces absolute URLs.

## Structure

| Path | Purpose |
| --- | --- |
| `_config.ts` | Lume configuration and plugin order |
| `_data.yml` | Site identity, menu, analytics, comments, languages |
| `_data/i18n.yml` | UI strings (`en` at the root, `id` under `id:`) |
| `posts/` | Blog posts (one file per post) |
| `posts/_data.yml` | Defaults for posts (`type`, layout, `basename: /`) |
| `pages/` | Standalone pages that shadow the theme |
| `_includes/` | Local overrides of the Xeo layouts and templates |
| `_plugins/multilanguage.ts` | Patched copy of Lume's multilanguage plugin |
| `images/diagrams/` | PlantUML diagrams pre-rendered to SVG |
| `diagram/` | PlantUML sources (not published) |
| `.migration/migrate.py` | One-off Hugo → Lume migration helper (not used at build time) |

The Xeo theme is loaded remotely at build time (`xeo/` in `deno.json`); local
files under `_includes/`, `pages/`, and the data files override it.

## Writing posts

Posts live in `posts/<slug>.md`:

```yaml
---
title: "Post title"
date: 2024-01-31T10:00:00+07:00
draft: false
lang: en
id: my-post-slug
tags:
  - Elixir
giscusTerm: /posts/my-post-slug/
oldUrl:
  - /posts/my-post-slug/
---
```

- `id` is required so the multilanguage plugin can pair translations.
- `lang` is `en` (default, unprefixed) or `id` (served from `/id/`).
- `giscusTerm` keeps the discussion attached to the old Hugo URL.
- `oldUrl` generates redirect pages from the previous Hugo URLs.
- The file name is the URL slug. If a file name has a `.en`/`.id` suffix,
  set `basename: <slug>` so the suffix does not leak into the URL.
- `categories` from Hugo were merged into `tags`; Xeo only has tag archives.

### Indonesian translations

For a page translated into Indonesian, add `translationsId`:

```yaml
translationsId:
  title: Judul
  description: Deskripsi
```

It is merged into `translations.id` by `_config.ts` before the multilanguage
plugin runs. Do not use a top-level `translations:` key on a page: Lume
replaces nested objects instead of merging them.

Global Indonesian overrides (site description, UI strings, copyright) live in
`_data.yml` (`translations.id`) and `_data/i18n.yml` (`id:`).

## Multilanguage plugin patch

Lume 3.3.2's `plugins/multilanguage.ts` assumes every language code is free for
use as a data key. The Indonesian code `id` collides with the page `id`
variable, so `_plugins/multilanguage.ts` is a patched copy that:

1. never deletes the page `id`;
2. does not register `mergeKey("id", ...)`;
3. reads Indonesian translations from `translations.id`.

When upgrading Lume, re-download the plugin, re-apply these three changes, and
check that `/id/` still has correct `alternates`, `hreflang`, and language
switcher links.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, builds with Deno, and
publishes `_site/` to GitHub Pages via `actions/deploy-pages`. `CNAME` pins the
custom domain to `fahri.blog`.

Repository settings required once:

- Pages → Source: **GitHub Actions**.
- Pages → Custom domain: `fahri.blog`, then enable **Enforce HTTPS**.
- DNS: apex `A`/`AAAA` records to GitHub Pages, `www` CNAME to
  `fahrinh.github.io`.

The old Hugo repository (`fahrinh/fahrinh.github.io`) is kept because the
Giscus discussions live there; comments are mapped with `mapping=specific` and
the old Hugo path as the term.

## Notes

- Diagrams are pre-rendered with `plantuml -tsvg diagram/*.plantuml` and
  committed under `images/diagrams/`.
- Search is provided by Pagefind and is generated per language.
- `TASK.md`, `PLAN_*.md`, `.agents/`, `diagram/`, and `.migration/` are not
  published.
