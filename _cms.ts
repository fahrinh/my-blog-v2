import lumeCMS from "lume/cms/mod.ts";

const cms = lumeCMS();

/** Append the timezone used by the blog to dates edited in the CMS. */
const timezone = {
  name: "date",
  type: "datetime" as const,
  label: "Date",
  description: "Publication date and time (Asia/Jakarta).",
  transform(value: { toString(): string } | null) {
    return value ? `${value}+07:00` : value;
  },
};

cms.document(
  "settings: Site settings",
  "src:_data.yml",
  [
    {
      name: "home",
      type: "object",
      label: "Home page",
      description:
        "English home page text. Indonesian overrides live in `translations.id`.",
      fields: [
        {
          name: "welcome",
          type: "text",
          label: "Title",
          description: "Homepage welcome message",
        },
        {
          name: "intro",
          type: "text",
          label: "Introduction",
          description: "Subtitle beneath the welcome message",
        },
      ],
    },
    {
      name: "copyright",
      type: "text",
      description: "Footer message (Markdown allowed)",
    },
    {
      name: "menu_links",
      type: "object-list",
      label: "Menu links",
      fields: [
        { name: "title", type: "text", label: "Title" },
        { name: "url", type: "text", label: "URL" },
      ],
    },
    {
      name: "metas",
      type: "object",
      label: "Meta tags",
      fields: [
        "site: text",
        "description: text",
        "title: text",
        "image: text",
        "lang: text",
      ],
    },
    {
      name: "analytics",
      type: "object",
      label: "Analytics",
      fields: ["id: text"],
    },
    {
      name: "comments",
      type: "object",
      label: "Comments",
      fields: [
        {
          name: "giscus",
          type: "object",
          fields: [
            "enable: checkbox",
            "repo: text",
            "repoId: text",
            "category: text",
            "categoryId: text",
          ],
        },
      ],
    },
  ],
);

cms.collection(
  "posts: Blog posts",
  "src:posts/*.md",
  [
    { name: "title", type: "text", label: "Title" },
    timezone,
    {
      name: "lang",
      type: "select",
      label: "Language",
      options: [
        { value: "en", label: "English" },
        { value: "id", label: "Bahasa Indonesia" },
      ],
    },
    {
      name: "draft",
      type: "checkbox",
      label: "Draft",
      description: "If checked, the post is not published.",
    },
    {
      name: "tags",
      type: "list",
      label: "Tags",
      description: "Used for tag archive pages.",
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      description: "Optional summary used in meta tags and feeds.",
    },
    {
      name: "image",
      type: "text",
      label: "Image",
      description: "Optional social preview image, e.g. /images/photo.png",
    },
    {
      name: "id",
      type: "text",
      label: "Translation ID",
      description:
        "Optional. Posts in different languages that share this value are linked as translations.",
    },
    {
      name: "basename",
      type: "text",
      label: "URL slug",
      description:
        "Optional. Only needed when the file name contains a .en/.id suffix.",
    },
    {
      name: "giscusTerm",
      type: "text",
      label: "Giscus term",
      description:
        "Optional. Old Hugo path used to match existing comment threads.",
    },
    {
      name: "oldUrl",
      type: "list",
      label: "Old URLs",
      description: "Optional. Previous URLs that redirect to this post.",
    },
    { name: "content", type: "markdown", label: "Content" },
  ],
);

cms.collection(
  "pages: Extra pages",
  "src:pages/*.md",
  [
    {
      name: "layout",
      type: "hidden",
      value: "layouts/page.vto",
    },
    { name: "title", type: "text", label: "Title" },
    {
      name: "draft",
      type: "checkbox",
      label: "Draft",
      description: "If checked, the page is not published.",
    },
    {
      name: "menu",
      type: "object",
      label: "Menu",
      fields: [
        {
          name: "visible",
          type: "checkbox",
          label: "Show in menu",
        },
        {
          name: "order",
          type: "number",
          label: "Order",
        },
      ],
    },
    { name: "content", type: "markdown", label: "Content" },
  ],
);

cms.document(
  "about: About page",
  "src:about.md",
  [
    { name: "title", type: "text", label: "Title" },
    timezone,
    {
      name: "menu",
      type: "object",
      label: "Menu",
      fields: [
        { name: "visible", type: "checkbox", label: "Show in menu" },
        { name: "order", type: "number", label: "Order" },
      ],
    },
    { name: "content", type: "markdown", label: "Content" },
  ],
);

cms.upload("images: Images", "src:images");

export default cms;
