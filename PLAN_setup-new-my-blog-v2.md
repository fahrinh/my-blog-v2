# PLAN — Setup new `my-blog-v2` (Lume + Xeo + Multilanguage + GitHub Pages)

**Task:** `TASK.md` item **1) Setup new my-blog-v2**
**Source content:** `../my-blog` (Hugo)
**Target stack:** [Lume](https://lume.land) + [Xeo theme](https://lume.land/theme/xeo/) + [Multilanguage plugin](https://lume.land/plugins/multilanguage/)
**Domain:** `https://fahri.blog`
**Assumed repo:** `fahrinh/my-blog-v2` (public, default branch `main`)

---

## 1. Goal and scope

Replace the Hugo blog in `../my-blog` with a new Lume site in this repository, using the Xeo theme, English/Indonesian multilanguage support, and GitHub Pages deployment from this repo itself.

### In scope

- Lume 3 project scaffold with Xeo v9 as a **remote theme**.
- English (default, no prefix) and Indonesian (`/id/`) URLs.
- Migration of the 9 published posts and 5 drafts from `../my-blog/content`.
- Hugo → Lume front matter and shortcode conversion.
- Language switcher, localized navigation/archive/tag pages, per-language feeds, hreflang, sitemap.
- Giscus comments, Google Analytics, old-URL redirects, static assets, local PlantUML diagrams.
- GitHub Actions deployment to GitHub Pages with `CNAME=fahri.blog`.
- Documentation of conventions and the local plugin patch.

### Out of scope (explicitly)

- Writing new English/Indonesian translations for posts that only exist in one language.
- LumeCMS.
- Migrating GitHub Discussions between repos (comments stay in `fahrinh/fahrinh.github.io`).
- Redirects for old Hugo tag/category detail URLs (`/tags/<tag>/`, `/categories/<cat>/`) and old feed `/index.xml`.
- Reworking the old `about.md` placeholder content.
- Copying externally hosted images (`user-images.githubusercontent.com`) into the repo.

---

## 2. Key technical decisions

| Area | Decision |
| --- | --- |
| Deployment | Build in `my-blog-v2` and deploy with `actions/deploy-pages` (official Lume GitHub Pages workflow). |
| Domain | `fahri.blog` (apex domain, GitHub Pages A/AAAA records + `CNAME` file). |
| Content | 9 published posts + 5 drafts as-is; drafts keep `draft: true` and are excluded unless `LUME_DRAFTS=true`. |
| Theme | Remote Xeo v9.0.3 via `xeo/` import, with local overrides only where language behavior is needed. |
| Languages | `en` (default, unprefixed) and `id` (`/id/` prefix). |
| Indonesian `id` collision | Local patched copy of Lume's `multilanguage.ts` (see §5.1). |
| Categories | Merged into `tags` (Xeo has tag/author archives, not categories). |
| Comments | Giscus `mapping=specific` with `giscusTerm` set to the old Hugo pathname so existing discussions still match. |
| Diagrams | Pre-render `diagram/*.plantuml` to SVG with local PlantUML; no runtime dependency on the old repo. |
| Old URLs | `oldUrl` front matter + Lume `redirects` plugin (HTML meta-refresh pages). |

---

## 3. Target URL map

| Page | English | Indonesian |
| --- | --- | --- |
| Home | `/` | `/id/` |
| Archive | `/archive/` | `/id/archive/` |
| Archive pagination | `/archive/2/` | `/id/archive/2/` |
| Tag | `/archive/<tag>/` | `/id/archive/<tag>/` |
| Author | `/author/Fahri/` | `/id/author/Fahri/` |
| Post | `/<post-slug>/` | `/id/<post-slug>/` |
| About | `/about/` | not translated (falls back to `/id/`) |
| Feed | `/feed.xml`, `/feed.json` | `/id/feed.xml`, `/id/feed.json` |
| 404 | `/404.html` | `/404.html` (single) |

Old Hugo URLs (`/posts/<slug>/`, `/id/posts/<slug>/`, `/post/<date>-<slug>/`, `/id/post/<date>-<slug>/`) redirect to the new URLs.

---

## 4. Target repository layout

```text
my-blog-v2/
├── deno.json
├── _config.ts
├── _plugins/
│   └── multilanguage.ts              # patched copy of lume/plugins/multilanguage.ts
├── _data.yml                         # site identity, nav, analytics, comments, translations
├── _data/
│   └── i18n.yml                      # EN strings + `id:` overrides
├── _includes/
│   ├── css/
│   │   └── lang.css                  # language switcher styles
│   ├── layouts/
│   │   ├── base.vto                  # override: lang switcher, GA, feeds, manifest
│   │   ├── post.vto                  # override: giscus, per-lang prev/next, archive link
│   │   ├── archive.vto               # override: per-lang tag/author filters
│   │   └── archive_result.vto        # override: localized back link
│   └── templates/
│       ├── giscus.vto
│       ├── language-switcher.vto
│       └── post-details.vto          # override: per-lang tag/author queries
├── index.vto                         # override: lang [en, id], per-lang posts
├── archive.page.js                   # override: per-lang archive
├── archive_result.page.js            # override: per-lang tag/author archives
├── 404.md                            # from Xeo (remote fallback)
├── pages/
│   └── contact.md                    # local draft, hides Xeo's demo contact page
├── posts/
│   ├── _data.yml                     # type/layout/basename/author
│   └── *.md                          # 14 migrated posts
├── about.md
├── images/
│   ├── watermelondb.png
│   ├── blog-app-mockup.png
│   └── diagrams/*.svg                # pre-rendered PlantUML
├── diagram/*.plantuml                # sources, ignored by build
├── favicon.png
├── favicon-16x16.png
├── favicon-32x32.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── site.webmanifest
├── yandex_1b3c8f61b6cc2289.html
├── cv.pdf
├── CNAME                             # fahri.blog
├── robots.txt
├── README.md
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml
```

`TASK.md`, `PLAN_*.md`, `.agents/`, `diagram/` are ignored by Lume.

---

## 5. Implementation steps (ordered)

### Phase 0 — Bootstrap

1. Create `fahrinh/my-blog-v2` (public, `main`) and add it as `origin`:
   ```sh
   gh repo create fahrinh/my-blog-v2 --public --source=. --remote=origin
   ```
   (If the repo already exists privately, make it public — raw asset URLs and GitHub Pages require it.)
2. Add `.gitignore`:
   ```gitignore
   _site/
   _cache/
   .DS_Store
   ```
3. Add `deno.json` (see §5.2), `_config.ts` (see §5.3), and `README.md`.

### Phase 1 — Xeo scaffold and configuration

1. Copy Xeo's baseline data files as local overrides:
   - `_data.yml` ← `https://raw.githubusercontent.com/famebot/xeo/v9.0.3/_data.yml`
   - `_data/i18n.yml` ← `https://raw.githubusercontent.com/famebot/xeo/v9.0.3/_data/i18n.yml`
   - `posts/_data.yml` ← `https://raw.githubusercontent.com/famebot/xeo/v9.0.3/posts/_data.yml`
2. Copy and customize the overridden layouts/generators listed in §4 (sources from the same Xeo tag).
3. Set site identity, nav, analytics, comments in `_data.yml` (see §6).
4. Add Indonesian strings in `_data/i18n.yml` under an `id:` key (see §6.2).

### Phase 2 — Multilanguage

1. Copy Lume's `plugins/multilanguage.ts` (v3.3.2) to `_plugins/multilanguage.ts`.
2. Rewrite relative imports to the `lume/` import map:
   `../core/*` → `lume/core/*`, `../../types.ts` → `lume/types.ts`.
3. Apply the patch in §5.1.
4. Register plugins in this order in `_config.ts`:
   ```ts
   site.use(xeo({ ... }));                 // URL-modifying plugins first
   site.use(multilanguage({ languages: ["en", "id"], defaultLanguage: "en" }));
   site.use(feed({ ... }));                // Indonesian feed
   site.use(redirects());                  // uses final URLs
   ```
5. Add the post-multilanguage preprocessor for `i18n` localization and `languageLinks` (see §5.3).
6. Verify with a scratch build:
   - `/id/` exists.
   - Indonesian pages keep `id` and have `alternates` with both languages when a translation exists.
   - `translations.id` overrides title/description.
   - `hreflang` and `<html lang>` are correct.

### Phase 3 — Content migration

For every file in `../my-blog/content/posts`:

1. Copy to `posts/`.
2. Convert TOML front matter (`+++`) to YAML (`---`).
3. Map Hugo fields:

   | Hugo | Lume |
   | --- | --- |
   | `title` | `title` (unchanged) |
   | `date` | `date` (unchanged ISO string) |
   | `draft` | `draft` |
   | `tags` | `tags` (merge `categories` into tags, dedupe) |
   | `categories` | removed (merged into `tags`) |
   | `aliases` | `oldUrl` array |
   | `images` | `image` (first entry, absolute `/images/...`) |
   | `summary` | `description` |
   | `toc` | removed (Xeo generates TOC automatically) |
   | — | `id: <slug>` (required for alternates) |
   | — | `lang: id` for Indonesian posts |
   | — | `basename: <slug>` for files with `.id`/`.en` suffix |
   | — | `giscusTerm: /posts/<slug>/` or `/id/posts/<slug>/` |
   | — | `oldUrl` includes `/posts/<slug>/` (or `/id/posts/<slug>/`) |

4. Replace Hugo shortcodes:
   - `{{< ref "file.md" >}}` → absolute new URL.
   - `{{< ref "file.md#anchor" >}}` → absolute new URL + anchor.
   - `{{< hint warning >}}...{{< /hint >}}` → GitHub alert block (`> [!warning]`).
5. Replace PlantUML proxy image URLs with local SVGs.
6. Keep `<!--more-->` (Xeo uses it for excerpts).

#### Content inventory

| # | Source file | Lang | New URL | Old URL(s) / notes |
| --- | --- | --- | --- | --- |
| 1 | `building-an-offline-first-react-web-app-using-watermelondb-in-phoenix-elixir.md` | en | `/building-an-offline-first-react-web-app-using-watermelondb-in-phoenix-elixir/` | `/posts/.../`; `image: /images/blog-app-mockup.png` |
| 2 | `file-downloading-in-headless-chrome-using-chromedriver-and-hound.md` | en | `/file-downloading-in-headless-chrome-using-chromedriver-and-hound/` | `/posts/.../`, `/post/2019-09-16-.../` |
| 3 | `generate-sequential-uuidv4-in-elixir.md` | en | `/generate-sequential-uuidv4-in-elixir/` | `/posts/.../`; drop `toc` |
| 4 | `hello-world.id.md` | id | `/id/hello-world/` | `/id/posts/hello-world/`; TOML→YAML; `basename: hello-world` |
| 5 | `how-to-build-watermelondb-sync-backend-in-elixir.md` | en | `/how-to-build-watermelondb-sync-backend-in-elixir/` | `/posts/.../`; `image: /images/watermelondb.png`; 3 `ref` shortcodes; 4 PlantUML images |
| 6 | `how-to-update-pomera-dm100-firmware.en.md` | en | `/how-to-update-pomera-dm100-firmware/` | `/posts/.../`, `/post/2017-11-22-.../`; `basename` |
| 7 | `java-how-to-autodetect-the-charset.en.md` | en | `/java-how-to-autodetect-the-charset/` | `/posts/.../`, `/post/2017-11-08-.../`; `basename`; drop `toc` |
| 8 | `oracle-xe-11g-on-docker.id.md` | id | `/id/oracle-xe-11g-on-docker/` | `/id/posts/.../`, `/id/post/2017-07-23-.../`; `basename` |
| 9 | `static-blogging-with-hugo.id.md` | id | `/id/static-blogging-with-hugo/` | `/id/posts/.../`; `basename` |
| 10 | `how-i-setup-jwt-authentication-with-social-login.md` | en | `/<slug>/` | draft |
| 11 | `how-to-build-watermelondb-sync-backend-using-go.md` | en | `/<slug>/` | draft; `hint` → alert |
| 12 | `how-to-copy-files-from-host-to-docker-container-using-docker-py.md` | en | `/<slug>/` | draft, empty content |
| 13 | `osx-how-to-store-secret-environment-variable-using-keychain.md` | en | `/<slug>/` | draft |
| 14 | `simple-centralized-logging-using-fluentd-and-mongodb.md` | en | `/<slug>/` | draft; PlantUML image |

Also migrate:
- `../my-blog/content/about.md` → `about.md` (`layout: layouts/page.vto`, `id: about`, `lang: en`, `menu: { visible: true, order: 2 }`, `/about/` preserved).
- Old home `_index.md` / `_index.id.md` content → `_data.yml` `home` strings and `translations.id.home`.

#### Tag mapping (categories merged in)

| Post | Tags |
| --- | --- |
| Building an Offline-First React App | `React`, `Phoenix`, `WatermelonDB`, `Offline First App` |
| File Downloading in Headless Chrome | `Elixir`, `Headless Chrome`, `ChromeDriver`, `Hound` |
| Generate Sequential UUIDv4 | `Elixir`, `UUIDv4` |
| Hello World | — |
| WatermelonDB Sync Backend (Elixir) | `Elixir`, `Phoenix`, `WatermelonDB`, `Sync Backend` |
| Pomera DM100 Firmware | `Gear`, `Pomera DM100` |
| Java Charset Autodetect | `Java`, `BOM`, `Byte Order Mark`, `Charset Encoding` |
| Oracle XE 11g | `Mini Tips`, `Oracle`, `Docker` |
| Static Blogging with Hugo | `Hugo`, `Github Pages`, `Travis CI` |

### Phase 4 — Assets and diagrams

1. Copy static assets:
   ```sh
   cp ../my-blog/static/CNAME CNAME                       # change to fahri.blog
   cp ../my-blog/static/site.webmanifest .
   cp ../my-blog/static/yandex_*.html .
   cp ../my-blog/static/cv.pdf .
   mkdir -p images
   cp ../my-blog/static/images/* images/
   cp ../my-blog/static/favicon-16x16.png ../my-blog/static/favicon-32x32.png .
   cp ../my-blog/static/android-chrome-192x192.png ../my-blog/static/android-chrome-512x512.png .
   cp ../my-blog/static/android-chrome-512x512.png favicon.png
   ```
   Do **not** copy `favicon.ico` / `apple-touch-icon.png`; the Lume favicon plugin generates them from `favicon.png`.
2. Update `site.webmanifest` (`name`, `short_name`, `start_url`).
3. Copy `diagram/` sources and pre-render:
   ```sh
   cp -R ../my-blog/diagram .
   mkdir -p images/diagrams
   plantuml -tsvg diagram/*.plantuml
   mv diagram/*.svg images/diagrams/
   ```
4. Update post image URLs:
   - `.../watermelondb.plantuml` → `/images/diagrams/watermelondb.svg`
   - `.../watermelondb-sync-flow.plantuml` → `/images/diagrams/watermelondb-sync-flow.svg`
   - `.../watermelondb-sync-flow-workaround.plantuml` → `/images/diagrams/watermelondb-sync-flow-workaround.svg`
   - `.../blog-app-architecture.plantuml` → `/images/diagrams/blog-app-architecture.svg`
   - `.../blog-app-mockup.plantuml` → `/images/diagrams/blog-app-mockup.svg`
   - `.../centralized-logging-setup.plantuml` → `/images/diagrams/centralized-logging-setup.svg`

### Phase 5 — Features

1. **Language switcher** in `base.vto` (see §7.1), driven by `languageLinks`.
2. **Giscus** partial included after the post article (see §7.2).
3. **Google Analytics** script in `base.vto` gated by `analytics.id`.
4. **Redirects** via `oldUrl` on posts, home, and archive page 1.
5. **Per-language feeds** via Xeo `feed` override + extra `feed()` plugin.
6. **Pagefind** (already in Xeo) — per-language indexes automatic via `<html lang>`.
7. **Robots.txt** with sitemap URL.
8. **Favicon/manifest links** in `base.vto`.

### Phase 6 — Deployment

1. Add `.github/workflows/deploy.yml` (see §8).
2. In GitHub → Settings → Pages:
   - Source: **GitHub Actions**.
   - Custom domain: `fahri.blog`.
   - Enforce HTTPS.
3. DNS for the apex domain `fahri.blog`:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www` → `CNAME fahrinh.github.io`
4. Old repo `fahrinh/fahrinh.github.io`:
   - Remove its custom domain (`fahri.id`) / disable Pages, or keep it as an archive with a notice.
   - Do **not** delete the repo: Giscus discussions live there.
5. GA4: update the web stream URL to `https://fahri.blog`.
6. Search Console: add `fahri.blog`, submit `https://fahri.blog/sitemap.xml`.

### Phase 7 — Validation

Run:

```sh
deno task build
LUME_DRAFTS=true deno task build   # optional drafts check
deno task serve                    # manual visual check
```

Checklist:

- [ ] `_site/index.html`, `_site/id/index.html`, `_site/archive/index.html`, `_site/id/archive/index.html` exist.
- [ ] All 9 published posts exist at root/`/id/`; no `.id`/`.en` in URLs.
- [ ] Drafts absent from the normal build; present with `LUME_DRAFTS=true`.
- [ ] `<html lang="en">` / `<html lang="id">` correct.
- [ ] `hreflang` links present; `x-default` points to `/`.
- [ ] Language switcher links to the translation or the other language's home.
- [ ] Archive/tag/author nav does not mix languages.
- [ ] `sitemap.xml` includes both languages.
- [ ] `/feed.xml` only English; `/id/feed.xml` only Indonesian.
- [ ] Giscus script appears once per post with the expected `data-term`.
- [ ] GA script appears once.
- [ ] Old URLs return redirect HTML to the new URLs.
- [ ] `_site/CNAME` contains `fahri.blog`.
- [ ] `_site/robots.txt` references the sitemap.
- [ ] Pagefind search works on both `/` and `/id/`.
- [ ] No Hugo shortcodes remain: `grep -rn '{{<' posts`.
- [ ] No broken local images: `grep -rn 'plantuml.com\|my-blog/master' posts`.
- [ ] `deno fmt --check` and `deno lint` pass (or document exceptions).

---

## 5.1 Patched multilanguage plugin (critical)

**Problem:** Lume's plugin uses the `id` page variable as the translation key. When `languages` includes `"id"` (Indonesian), `mergeTranslations()` treats `data.id` (a string) as the Indonesian translation object, deletes the page `id`, and breaks `alternates`/hreflang. This was reproduced in a scratch Lume 3.3.2 build.

**Solution:** Keep the official plugin, but copy it locally with a small documented diff.

File: `_plugins/multilanguage.ts` (from `https://cdn.jsdelivr.net/gh/lumeland/lume@3.3.2/plugins/multilanguage.ts`)

Diff:

```diff
+ // Local patch: the "id" language code collides with the page "id" variable.
+ // Indonesian translations are read from `translations.id` and the page id is
+ // never deleted. Re-apply this patch when upgrading Lume.
...
-    options.languages.forEach((lang) => site.mergeKey(lang, "data"));
+    site.mergeKey("translations", "data");
+    options.languages.forEach((lang) => {
+      if (lang !== "id") site.mergeKey(lang, "data");
+    });
...
-      const override = data[lang] as Data | undefined;
+      const override = (lang === "id"
+        ? (data.translations as Data | undefined)?.[lang]
+        : data[lang]) as Data | undefined;
...
-      for (const key of options.languages) {
-        delete data[key];
-      }
+      for (const key of options.languages) {
+        if (key !== "id") delete data[key];
+      }
+      delete data.translations;
```

Also rewrite imports:

```diff
-import { Page } from "../core/file.ts";
+import { Page } from "lume/core/file.ts";
...
-import type { Data } from "../../types.ts";
+import type { Data } from "lume/types.ts";
```

**Consequences / conventions:**

- Never write a top-level `id:` translation block in front matter or `_data.yml`.
- Use `translations.id` for Indonesian page/data overrides:
  ```yaml
  translations:
    id:
      title: Beranda
      home:
        welcome: ...
  ```
- The page `id` remains the translation key (e.g. `id: hello-world`).
- Add a note in `README.md`: re-copy and re-apply the patch on Lume upgrades.

**Verified behavior** (scratch build): `/id/` and `/` generated, `id` preserved, `alternates` contain both languages when both pages share `id`/`type`, `translations.id.title` applied.

---

## 5.2 `deno.json`

```json
{
  "imports": {
    "lume/": "https://cdn.jsdelivr.net/gh/lumeland/lume@3.3.2/",
    "lume/jsx-runtime": "https://cdn.jsdelivr.net/gh/oscarotero/ssx@0.1.15/jsx-runtime.ts",
    "lume/markdown-plugins/": "https://cdn.jsdelivr.net/gh/lumeland/markdown-plugins@0.12.0/",
    "mdit/plugin-alert": "https://cdn.jsdelivr.net/npm/@mdit/plugin-alert@2.0.0/dist/index.js",
    "xeo/": "https://cdn.jsdelivr.net/gh/famebot/xeo@9.0.3/",
    "date-fns/": "npm:date-fns@4.4.0/"
  },
  "tasks": {
    "lume": {
      "description": "Run Lume command",
      "command": "deno run -P=lume lume/cli.ts"
    },
    "build": {
      "description": "Build the site for production",
      "command": "deno task lume"
    },
    "serve": {
      "description": "Run and serve the site for development",
      "command": "deno task lume -s"
    },
    "d": "deno task serve",
    "s": "deno task serve",
    "prod": "deno task lume --location=https://fahri.blog",
    "new": "deno task lume new"
  },
  "compilerOptions": {
    "types": ["lume/types.ts"],
    "jsx": "react-jsx",
    "jsxImportSource": "lume"
  },
  "lint": {
    "exclude": ["./_site"],
    "rules": {
      "tags": ["recommended"],
      "exclude": ["no-import-prefix"]
    },
    "plugins": ["https://cdn.jsdelivr.net/gh/lumeland/lume@3.3.2/lint.ts"]
  },
  "fmt": {
    "exclude": ["./_site"]
  },
  "unstable": ["temporal", "fmt-component"],
  "permissions": {
    "lume": {
      "read": true,
      "write": ["./"],
      "import": [
        "cdn.jsdelivr.net:443",
        "jsr.io:443",
        "deno.land:443",
        "registry.npmjs.org:443"
      ],
      "net": [
        "0.0.0.0",
        "127.0.0.1:9229",
        "cdn.jsdelivr.net:443",
        "data.jsdelivr.com:443",
        "fonts.googleapis.com:443",
        "fonts.gstatic.com:443",
        "jsr.io:443",
        "deno.land:443",
        "registry.npmjs.org:443"
      ],
      "env": true,
      "run": true,
      "ffi": true,
      "sys": true
    }
  },
  "lock": false
}
```

Notes:
- `location` **must be a `URL` object** in `_config.ts`; a string breaks `site.url()`.
- `deno-version` in CI: `v2.x` (Lume 3 / Xeo v9 require Deno 2.7+).

---

## 5.3 `_config.ts`

```ts
import lume from "lume/mod.ts";
import xeo from "xeo/mod.ts";
import multilanguage from "./_plugins/multilanguage.ts";
import feed from "lume/plugins/feed.ts";
import redirects from "lume/plugins/redirects.ts";
import { mergeRecursiveObjects } from "lume/core/utils/merge_data.ts";
import { en as enLocale, id as idLocale } from "date-fns/locale";

import "lume/types.ts";

const site = lume({
  location: new URL("https://fahri.blog"),
});

site.use(xeo({
  date: { locales: { en: enLocale, id: idLocale } },
  favicon: { input: "/favicon.png" },
  prism: { autoloadLanguages: true },
  feed: {
    output: ["/feed.xml", "/feed.json"],
    query: "type=post lang=en",
    info: {
      title: "=metas.site",
      description: "A blog by Fahri Nurul Hidayat",
      lang: "en",
    },
    items: { title: "=title" },
  },
}));

site.use(multilanguage({
  languages: ["en", "id"],
  defaultLanguage: "en",
}));

// Indonesian feed
site.use(feed({
  output: ["/id/feed.xml", "/id/feed.json"],
  query: "type=post lang=id",
  info: {
    title: "=metas.site",
    description: "Blog oleh Fahri Nurul Hidayat",
    lang: "id",
  },
  items: { title: "=title" },
}));

site.use(redirects());

// Localize i18n and build language-switcher links after multilanguage runs.
site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const lang = page.data.lang as string | undefined;
    if (!lang) continue;

    const i18n = page.data.i18n as Record<string, unknown> | undefined;
    if (i18n && lang !== "en" && i18n[lang]) {
      const localized = mergeRecursiveObjects(
        i18n,
        i18n[lang] as Record<string, unknown>,
      );
      delete localized[lang];
      page.data.i18n = localized;
    }

    const alts = (page.data.alternates ?? []) as Array<
      { lang: string; url: string }
    >;
    const languages = page.data.languages as string[];
    const defaultLanguage = page.data.defaultLanguage as string;

    page.data.languageLinks = languages.map((l) => {
      const alt = alts.find((a) => a.lang === l);
      return {
        lang: l,
        url: alt?.url ?? (l === defaultLanguage ? "/" : `/${l}/`),
        current: l === lang,
        label: l === "en" ? "English" : "Bahasa Indonesia",
        short: l.toUpperCase(),
      };
    });
  }
});

site.ignore("TASK.md", "PLAN_setup-new-my-blog-v2.md", ".agents", "diagram");
site.add([
  "CNAME",
  "robots.txt",
  "site.webmanifest",
  "cv.pdf",
  "images",
  "yandex_1b3c8f61b6cc2289.html",
]);

export default site;
```

Notes:
- `site.ignore("diagram")` keeps `.plantuml` sources out of `_site`; the SVGs live in `images/diagrams/`.
- `pages/contact.md` is overridden locally as a draft to hide Xeo's demo contact page.
- `feed` info descriptions are literals because `=metas.description` resolves site data, not per-language page data.

---

## 6. Data files

### 6.1 `_data.yml`

```yaml
lang: en
home:
  welcome: "Fahri NH"
  intro: "A blog by Fahri Nurul Hidayat. [English](/) · [Bahasa Indonesia](/id/)"
  posts: 12

archives:
  posts: 24
  tag: 12
  author: 12
  basename: archive

copyright: "&copy; 2017–2026 Fahri Nurul Hidayat"

menu_links:
  - title: GitHub
    url: https://github.com/fahrinh
    target: _blank

logo:
  svg: ""
  height: 48

metas:
  site: Fahri NH
  description: A blog by Fahri Nurul Hidayat
  title: "=title"
  image: "=image"
  lang: en
  generator: false

analytics:
  id: G-MQ5LN0JS5P

comments:
  giscus:
    enable: true
    repo: fahrinh/fahrinh.github.io
    repoId: MDEwOlJlcG9zaXRvcnk5ODAzNzU4MA==
    category: Announcements
    categoryId: DIC_kwDOBdfvTM4CTQ_z

languages:
  - en
  - id
defaultLanguage: en
unmatchedLangUrl: "/"

translations:
  id:
    home:
      welcome: "Fahri NH"
      intro: "Blog oleh Fahri Nurul Hidayat. [English](/) · [Bahasa Indonesia](/id/)"
    metas:
      description: Blog oleh Fahri Nurul Hidayat
      lang: id
    copyright: "&copy; 2017–2026 Fahri Nurul Hidayat"
```

### 6.2 `_data/i18n.yml`

Copy Xeo's English keys and add Indonesian overrides:

```yaml
nav:
  toc: Table of Contents
  next_post: Newer post →
  previous_post: ← Older post
  continue_reading: Continue reading →
  archive_title: Archive
  archive_search: Search
  back: ← Back
  page: Page
  next: Next →
  previous: ← Previous
post:
  by: by
  reading_time: min read
search:
  by_author: Posts by
  by_tag: Tagged
  tags: Tags
  authors: Authors
comments:
  title: Comments

id:
  nav:
    toc: Daftar Isi
    next_post: Posting lebih baru →
    previous_post: ← Posting lebih lama
    continue_reading: Baca selengkapnya →
    archive_title: Arsip
    archive_search: Cari
    back: ← Kembali
    page: Halaman
    next: Berikutnya →
    previous: ← Sebelumnya
  post:
    by: oleh
    reading_time: menit baca
  search:
    by_author: Posting oleh
    by_tag: Dengan tag
    tags: Tag
    authors: Penulis
  comments:
    title: Komentar
```

The `_config.ts` preprocessor deep-merges `i18n.id` into `i18n` per Indonesian page, so existing templates keep using `i18n.nav.*`.

### 6.3 `posts/_data.yml`

```yaml
type: post
layout: layouts/post.vto
basename: /
author: Fahri
```

### 6.4 Example migrated post front matter

```yaml
---
title: "How to Build WatermelonDB Sync Backend in Elixir"
date: 2020-04-24T21:27:12+07:00
tags: ["Elixir", "Phoenix", "WatermelonDB", "Sync Backend"]
draft: false
id: how-to-build-watermelondb-sync-backend-in-elixir
image: /images/watermelondb.png
description: "WatermelonDB is a reactive database for React frontend applications..."
giscusTerm: /posts/how-to-build-watermelondb-sync-backend-in-elixir/
oldUrl:
  - /posts/how-to-build-watermelondb-sync-backend-in-elixir/
---
```

Indonesian example:

```yaml
---
title: "Oracle XE 11g dengan Docker"
date: 2017-07-23T06:26:06+07:00
lang: id
id: oracle-xe-11g-on-docker
basename: oracle-xe-11g-on-docker
tags: ["Mini Tips", "Oracle", "Docker"]
draft: false
giscusTerm: /id/posts/oracle-xe-11g-on-docker/
oldUrl:
  - /id/posts/oracle-xe-11g-on-docker/
  - /id/post/2017-07-23-oracle-xe-11g-on-docker/
---
```

---

## 7. Layout overrides

### 7.1 `_includes/layouts/base.vto`

Copy Xeo's v9.0.3 base layout and change:

1. Title:
   ```vto
   {{ if it.id === "home" }}{{ metas.site }}{{ else }}{{ it.title || metas.title }} - {{ metas.site }}{{ /if }}
   ```
2. Add `lang.css`, favicon/manifest links, and per-language feeds:
   ```vto
   {{ set feedBase = lang === defaultLanguage ? "" : "/" + lang }}
   <link rel="stylesheet" href="/lang.css">
   <link rel="icon" href="/favicon.ico" sizes="any">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   <link rel="manifest" href="/site.webmanifest">
   <link rel="alternate" href="{{ feedBase }}/feed.xml" type="application/atom+xml" title="{{ metas.site }}">
   <link rel="alternate" href="{{ feedBase }}/feed.json" type="application/json" title="{{ metas.site }}">
   ```
3. Add GA in `<head>`:
   ```vto
   {{ if analytics?.id }}
   <script async src="https://www.googletagmanager.com/gtag/js?id={{ analytics.id }}"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag("js", new Date());
     gtag("config", "{{ analytics.id }}");
   </script>
   {{ /if }}
   ```
4. Nav menu query:
   ```vto
   {{ for entry of search.pages(`menu.visible=true lang=${lang}`, "menu.order") }}
   ```
5. Insert the language switcher before the theme toggle:
   ```vto
   <li class="lang-switcher">
     {{ for link of languageLinks }}
       <a href="{{ link.url }}" hreflang="{{ link.lang }}" lang="{{ link.lang }}"
          title="{{ link.label }}"
          {{ if link.current }}aria-current="true"{{ /if }}>{{ link.short }}</a>
     {{ /for }}
   </li>
   ```
6. Footer feed links use `{{ feedBase }}`.

### 7.2 `_includes/templates/giscus.vto`

```vto
{{ if comments?.giscus?.enable }}
<section class="comments" data-pagefind-ignore>
  <h2>{{ i18n.comments?.title ?? "Comments" }}</h2>
  <script
    src="https://giscus.app/client.js"
    data-repo="{{ comments.giscus.repo }}"
    data-repo-id="{{ comments.giscus.repoId }}"
    data-category="{{ comments.giscus.category }}"
    data-category-id="{{ comments.giscus.categoryId }}"
    data-mapping="specific"
    data-term="{{ giscusTerm || url }}"
    data-strict="0"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="top"
    data-theme="preferred_color_scheme"
    data-lang="{{ lang }}"
    data-loading="lazy"
    crossorigin="anonymous"
    async
  ></script>
</section>
{{ /if }}
```

Include it in `_includes/layouts/post.vto` after `</article>`.

### 7.3 `_includes/layouts/post.vto`

Copy Xeo's v9.0.3 post layout and change:

1. Prev/next queries:
   ```vto
   {{ set previousPost = search.previousPage(url, `type=post lang=${lang}`) }}
   {{ set nextPost = search.nextPage(url, `type=post lang=${lang}`) }}
   ```
2. Replace the undefined `i18n.nav.archive` line with a localized archive link:
   ```vto
   {{ set archive = search.page(`type=archive lang=${lang} pagination.page=1`) }}
   <p><a href="{{ archive.url }}">{{ i18n.nav.archive_title }}</a></p>
   ```
3. Add `{{ include "templates/giscus.vto" }}` after the article.

### 7.4 `_includes/templates/post-details.vto`

Add `lang` to the tag/author queries so Indonesian posts link to Indonesian tag pages:

```vto
{{ set page = search.page(`type=tag tag="${tag}" lang=${lang}`) }}
{{ set page = search.page(`type=author author="${author}" lang=${lang}`) }}
```

### 7.5 `_includes/layouts/archive.vto`

Copy Xeo's layout and add `lang` to the author/tag nav queries:

```vto
{{ set pageAuthors = search.pages(`type=author pagination.page=1 lang=${lang}`, "author") }}
{{ set pageTags = search.pages(`type=tag pagination.page=1 lang=${lang}`, "tag") }}
```

### 7.6 `_includes/layouts/archive_result.vto`

Replace the hardcoded back link:

```vto
{{ set archive = search.page(`type=archive lang=${lang} pagination.page=1`) }}
<p class="nav-back"><a href="{{ archive.url }}">{{ i18n.nav.back }}</a></p>
```

### 7.7 `index.vto`

```vto
---
layout: layouts/base.vto
bodyClass: body-home
title: Home
id: home
lang: [en, id]
oldUrl: ["/posts/"]
translations:
  id:
    title: Beranda
    oldUrl: ["/id/posts/"]
---

{{ set archive = search.page(`type=archive lang=${lang} pagination.page=1`) }}

<header class="page-header center">
  <h1 class="page-title">{{ home.welcome }}</h1>
  <div class="page-subtitle">{{ home.intro |> md }}</div>
</header>

<main class="{{ it.bodyClass }}">
  <section class="postList">
    <br>
    {{ for post of search.pages(`type=post lang=${lang}`, "date=desc", home.posts) }}
      ...
    {{ /for }}
  </section>

  <hr>
  <p>
    {{ i18n.nav.archive_search }}
    <a href="{{ archive.url }}">{{ i18n.nav.archive_title }}</a>
  </p>
  <div class="search" id="search"></div>
</main>
```

### 7.8 `archive.page.js`

```js
export const layout = "layouts/archive.vto";

export default function* ({ search, paginate, i18n, archives }) {
  for (const lang of ["en", "id"]) {
    const nav = lang === "id"
      ? { ...i18n.nav, ...i18n.id?.nav }
      : i18n.nav;
    const posts = search.pages(`type=post lang=${lang}`, "date=desc");

    const url = (n) =>
      n === 1
        ? `/${archives.basename}/`
        : `/${archives.basename}/${n}/`;

    for (const data of paginate(posts, { url, size: archives.posts })) {
      yield {
        ...data,
        lang,
        id: `archive-${data.pagination.page}`,
        type: "archive",
        title: nav.archive_title,
        oldUrl: data.pagination.page === 1
          ? (lang === "en"
            ? ["/tags/", "/categories/"]
            : ["/id/tags/", "/id/categories/"])
          : undefined,
        menu: data.pagination.page === 1
          ? { visible: true, order: 1 }
          : undefined,
      };
    }
  }
}
```

### 7.9 `archive_result.page.js`

```js
export const layout = "layouts/archive_result.vto";

export default function* ({ search, paginate, i18n, archives }) {
  for (const lang of ["en", "id"]) {
    const searchI18n = lang === "id"
      ? { ...i18n.search, ...i18n.id?.search }
      : i18n.search;

    const posts = search.pages(`type=post lang=${lang}`, "date=desc");
    const tags = new Set();
    for (const post of posts) {
      for (const tag of post.tags ?? []) tags.add(tag);
    }

    for (const tag of tags) {
      const tagPages = search.pages(
        `type=post lang=${lang} '${tag}'`,
        "date=desc",
      );
      const url = (n) =>
        n === 1
          ? `/${archives.basename}/${tag}/`
          : `/${archives.basename}/${tag}/${n}/`;

      for (const page of paginate(tagPages, { url, size: archives.tag })) {
        yield {
          ...page,
          lang,
          id: `tag-${tag}-${page.pagination.page}`,
          type: "tag",
          tag,
          title: `${searchI18n.by_tag} “${tag}”`,
        };
      }
    }

    const authors = new Set(posts.map((post) => post.author).filter(Boolean));
    for (const author of authors) {
      const authorPages = search.pages(
        `type=post author='${author}' lang=${lang}`,
      );
      const url = (n) =>
        n === 1
          ? `/author/${author}/`
          : `/${archives.basename}/${author}/${n}/`;

      for (
        const page of paginate(authorPages, {
          url,
          size: archives.author,
        })
      ) {
        yield {
          ...page,
          lang,
          id: `author-${author}-${page.pagination.page}`,
          type: "author",
          author,
          title: `${searchI18n.by_author} ${author}`,
        };
      }
    }
  }
}
```

> `slugifyUrls` (from Xeo) lowercases/slugifies the generated URLs, so tag URLs become `/archive/elixir/` etc.

### 7.10 `_includes/css/lang.css`

```css
.lang-switcher {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}

.lang-switcher a {
  text-decoration: none;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.lang-switcher a[aria-current="true"] {
  font-weight: 700;
  text-decoration: underline;
}
```

### 7.11 `pages/contact.md`

```md
---
title: Contact
draft: true
---
```

This overrides Xeo's remote demo contact page.

---

## 8. GitHub Actions workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Clone repository
        uses: actions/checkout@v4

      - name: Setup Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
          cache: true

      - name: Build site
        run: deno task build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

`CNAME` contains exactly:

```text
fahri.blog
```

`robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://fahri.blog/sitemap.xml
```

---

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Patched `multilanguage.ts` diverges on Lume upgrade | Pin Lume `3.3.2`; document diff in README; after upgrade, re-copy and re-apply, then re-test `/id/` alternates. |
| `id` language code collision elsewhere | Use `translations.id` only; never a top-level `id:` translation block. |
| Giscus comments not matching old discussions | Use `mapping=specific` + `giscusTerm` equal to the old Hugo pathname; verify one post. Keep the `fahrinh/fahrinh.github.io` repo alive. |
| Language switcher links to wrong page | `languageLinks` falls back to the other language's home when no translation exists; add translations later to pair pages. |
| Archive/tag nav mixes languages | All nav/tag/author queries filter by `lang`. |
| Pagefind indexes wrong language | `<html lang>` is set by `base.vto`; verify `/id/` pages. |
| `location` string breaks absolute URLs | Use `new URL("https://fahri.blog")` in `_config.ts`. |
| PlantUML SVGs differ from proxy output | Visually check each rendered diagram; keep `.plantuml` sources for edits. |
| Apex domain DNS misconfigured | Use GitHub's A/AAAA records; verify in Pages settings and `dig fahri.blog`. |
| Old repo custom domain conflicts | Remove/disable the old repo's Pages custom domain. |
| Drafts accidentally published | Do not set `LUME_DRAFTS` in CI; normal build excludes `draft: true`. |
| Remote theme overrides break on Xeo upgrade | Pin Xeo `v9.0.3`; review overrides when bumping. |
| External images in old posts disappear | Out of scope; optionally mirror `user-images.githubusercontent.com` assets later. |

---

## 10. Manual follow-ups after implementation

- [ ] Create/publish `fahrinh/my-blog-v2`.
- [ ] Configure GitHub Pages (source: GitHub Actions, custom domain `fahri.blog`, HTTPS).
- [ ] Configure DNS (A/AAAA + `www` CNAME).
- [ ] Remove the old repo's custom domain / disable its Pages.
- [ ] Update GA4 stream URL to `https://fahri.blog`.
- [ ] Add `fahri.blog` to Google Search Console and submit the sitemap.
- [ ] Verify one migrated post shows its old Giscus comments.
- [ ] Optionally translate the remaining English-only posts and `about.md` into Indonesian.
- [ ] Optionally add redirects for old `/tags/<tag>/` and `/categories/<cat>/` URLs and `/index.xml`.

---

## Appendix A — Discovery Log

| # | Question | Options presented | User answer |
| --- | --- | --- | --- |
| 1 | How should `my-blog-v2` deploy to GitHub Pages? | **1.a** Keep `fahrinh.github.io` + deploy key (recommended); **1.b** Publish from `my-blog-v2` itself; **1.c** Project page under `/my-blog-v2/` | **1.b** Publish from `my-blog-v2` itself |
| 2 | Which domain should the new site use? | **2.a** Keep `fahri.id` (recommended); **2.b** Use default project URL; **2.c** Other domain | **2.c** Other domain → follow-up answer: **`fahri.blog`** |
| 3 | Which content should be migrated? | **3.a** Published + drafts as-is (recommended); **3.b** Published posts only; **3.c** Fully translate all posts; **3.d** Published only, no drafts | **3.a** Published + drafts as-is |
| 4 | Which of the old site's extras should be ported? (multi-select) | **4.a** Giscus comments (recommended); **4.b** Google Analytics; **4.c** Old-URL redirects (recommended); **4.d** Static assets (recommended); **4.e** Local PlantUML diagrams; **4.f** None | **4.a, 4.b, 4.c, 4.d, 4.e** — all selected |
| 5 | How should Xeo be integrated? | **5.a** Remote theme + local overrides (recommended); **5.b** Vendor the theme; **5.c** Fork as base template | **5.a** Remote theme + local overrides |
| 6 | How should the Indonesian `id` language-code collision be handled? | **6.a** Patch plugin locally (recommended); **6.b** Use `id-ID` language code; **6.c** Custom i18n plugin; **6.d** Use `/in/` with URL rewrite | **6.a** Patch plugin locally |

### Technical discoveries during planning

1. **`id` language code breaks Lume's multilanguage plugin.** Reproduced with Lume 3.3.2: `mergeTranslations()` reads `data.id` as the Indonesian translation object, deletes the page `id`, and produces `alternates` containing only the current page. Confirmed that a local patch (keep `id`, use `translations.id`) fixes `/id/` URLs, alternates, and translated data.
2. **`location` must be a `URL` object.** `lume({ location: "https://..." })` breaks `site.url()` with `options.location.pathname` undefined; use `new URL(...)`.
3. **Xeo serves posts from `/`** (`basename: /` in `posts/_data.yml`), so old `/posts/<slug>/` URLs need redirects.
4. **`.id`/`.en` filename suffixes become part of the URL** unless `basename` is set explicitly; the migration sets `basename` for those five files.
5. **Pagefind is multilingual out of the box** via the `<html lang>` attribute; no extra plugin configuration needed.
6. **Xeo's `archive.page.js` and `archive_result.page.js` do not filter by language**; both are overridden in this plan.
7. **Xeo's remote `pages/contact.md` is added to every site**; a local draft override hides it.
8. **Prism autoload is off by default**; the plan enables `prism.autoloadLanguages` so Elixir/Go/Java/Kotlin/SQL/YAML/Diff code blocks highlight correctly.
9. **PlantUML is available locally** (`/opt/homebrew/bin/plantuml`), so diagrams can be pre-rendered to SVG and served locally instead of through the PlantUML proxy.
10. **Old domain `fahri.id` no longer serves the blog** (it currently resolves to unrelated content), so preserving old URLs is a best-effort redirect exercise; the new canonical domain is `fahri.blog`.
