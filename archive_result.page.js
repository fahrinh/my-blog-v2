export const layout = "layouts/archive_result.vto";

export default function* ({ search, paginate, i18n, archives }) {
  for (const lang of ["en", "id"]) {
    const strings = lang === "id"
      ? { ...i18n.search, ...i18n.id?.search }
      : i18n.search;

    const posts = search.pages(`type=post lang=${lang}`, "date=desc");

    const tags = new Set();
    for (const post of posts) {
      for (const tag of post.tags ?? []) {
        tags.add(tag);
      }
    }

    // Generate a page for each tag
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
          title: `${strings.by_tag} “${tag}”`,
        };
      }
    }

    // Generate a page for each author
    const authors = new Set(
      posts.map((post) => post.author).filter(Boolean),
    );

    for (const author of authors) {
      const authorPages = search.pages(
        `type=post author='${author}' lang=${lang}`,
        "date=desc",
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
          title: `${strings.by_author} ${author}`,
        };
      }
    }
  }
}
