import lume from "lume/mod.ts";
import xeo from "xeo/mod.ts";
import feed from "lume/plugins/feed.ts";
import redirects from "lume/plugins/redirects.ts";
import { mergeRecursiveObjects } from "lume/core/utils/merge_data.ts";
import { enUS as enLocale, id as idLocale } from "npm:date-fns@4.4.0/locale";

import multilanguage from "./_plugins/multilanguage.ts";

import "lume/types.ts";

const site = lume({
  // Must be a URL object: a string breaks site.url() in Lume 3.
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

// Merge page-local Indonesian overrides into the global translations before
// the multilanguage plugin consumes them. Page-local overrides must use the
// `translationsId` key because Lume's deep merge of `translations` replaces
// nested objects instead of merging them.
site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const local = page.data.translationsId as
      | Record<string, unknown>
      | undefined;
    if (!local) {
      continue;
    }

    // Copy before merging: page data shares the global `translations` object,
    // so mutating it would leak overrides to every page.
    const translations = {
      ...(page.data.translations ?? {}),
    } as Record<string, Record<string, unknown>>;
    translations.id = mergeRecursiveObjects({ ...translations.id }, local);
    page.data.translations = translations;
    delete page.data.translationsId;
  }
});

// Xeo uses the text before `<!--more-->` as the excerpt and falls back to the
// whole post when the marker is missing. Hugo truncated at ~70 words instead,
// so keep the home page readable by using the first paragraph as fallback.
site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const content = page.data.content;
    const excerpt = page.data.excerpt;
    if (typeof content !== "string" || excerpt !== content) {
      continue;
    }

    const paragraph = content.split(/\n\s*\n/).find((block) => {
      const text = block.trim();
      return text && !text.startsWith("<") && !text.startsWith("#");
    });
    if (paragraph) {
      page.data.excerpt = paragraph.trim();
    }
  }
});

// The slugify plugin also renames static .html files. Restore the exact name
// required by Yandex site verification.
site.preprocess([".html"], () => {
  for (const file of site.files) {
    if (file.outputPath.includes("yandex-1b3c8f61b6cc2289.html")) {
      file.data.url = "/yandex_1b3c8f61b6cc2289.html";
    }
  }
});

// Registered after Xeo so the language prefixes are applied to the final URLs.
site.use(multilanguage({
  languages: ["en", "id"],
  defaultLanguage: "en",
}));

// Indonesian feed. Registered after multilanguage so page URLs are final.
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

// Registered last: oldUrl values are resolved against the final, prefixed URLs.
site.use(redirects());

// Runs after the multilanguage preprocessors: localize i18n strings and build
// the language switcher links.
site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const lang = page.data.lang as string | undefined;
    if (!lang) {
      continue;
    }

    const i18n = page.data.i18n as Record<string, unknown> | undefined;
    if (i18n && lang !== "en" && i18n[lang]) {
      const localized = mergeRecursiveObjects(
        i18n,
        i18n[lang] as Record<string, unknown>,
      );
      delete localized[lang];
      page.data.i18n = localized;
    }

    const alternates = (page.data.alternates ?? []) as Array<
      { lang?: string; url: string }
    >;
    const languages = (page.data.languages ?? []) as string[];
    const defaultLanguage = page.data.defaultLanguage as string;

    page.data.languageLinks = languages.map((language) => {
      const alternate = alternates.find((alt) => alt.lang === language);
      return {
        lang: language,
        url: alternate?.url ??
          (language === defaultLanguage ? "/" : `/${language}/`),
        current: language === lang,
        label: language === "en" ? "English" : "Bahasa Indonesia",
        short: language.toUpperCase(),
      };
    });
  }
});

site.ignore(
  "TASK.md",
  "PLAN_setup-new-my-blog-v2.md",
  ".agents",
  "diagram",
);

site.add("CNAME");
site.add("robots.txt");
site.add("site.webmanifest");
site.add("cv.pdf");
site.add("images");
site.copy("yandex_1b3c8f61b6cc2289.html");

export default site;
