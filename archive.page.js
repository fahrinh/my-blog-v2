export const layout = "layouts/archive.vto";

export default function* ({ search, paginate, i18n, archives }) {
  for (const lang of ["en", "id"]) {
    const nav = lang === "id" ? { ...i18n.nav, ...i18n.id?.nav } : i18n.nav;
    const posts = search.pages(`type=post lang=${lang}`, "date=desc");

    const url = (n) =>
      n === 1 ? `/${archives.basename}/` : `/${archives.basename}/${n}/`;

    for (const data of paginate(posts, { url, size: archives.posts })) {
      const isFirst = data.pagination.page === 1;

      yield {
        ...data,
        lang,
        id: `archive-${data.pagination.page}`,
        type: "archive",
        title: nav.archive_title,
        oldUrl: isFirst
          ? (lang === "en" ? ["/tags/", "/categories/"] : [
            "/id/tags/",
            "/id/categories/",
          ])
          : undefined,
        // Show the first page in the menu
        menu: isFirst ? { visible: true, order: 1 } : undefined,
      };
    }
  }
}
