#!/usr/bin/env python3
"""One-off migration helper: Hugo content -> Lume (Xeo) posts.

Not part of the site build. Kept in the repo for traceability.
"""

import re
import pathlib

SRC = pathlib.Path("../my-blog/content")
DST = pathlib.Path(".")

# slug -> extra metadata
IMAGE = {
    "building-an-offline-first-react-web-app-using-watermelondb-in-phoenix-elixir": "/images/blog-app-mockup.png",
    "how-to-build-watermelondb-sync-backend-in-elixir": "/images/watermelondb.png",
}
DESCRIPTION = {
    "how-to-build-watermelondb-sync-backend-in-elixir": (
        "WatermelonDB is a reactive database for React frontend application "
        "that supports data synchronization. This tutorial explains the concept "
        "and shows step by step how to build sync backend using Phoenix (Elixir)"
    ),
}

PLANTUML = {
    "https://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/watermelondb.plantuml": "/images/diagrams/watermelondb.svg",
    "https://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/watermelondb-sync-flow.plantuml": "/images/diagrams/watermelondb-sync-flow.svg",
    "https://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/watermelondb-sync-flow-workaround.plantuml": "/images/diagrams/watermelondb-sync-flow-workaround.svg",
    "https://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/blog-app-architecture.plantuml": "/images/diagrams/blog-app-architecture.svg",
    "http://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/blog-app-mockup.plantuml": "/images/diagrams/blog-app-mockup.svg",
    "http://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/fahrinh/my-blog/master/diagram/centralized-logging-setup.plantuml": "/images/diagrams/centralized-logging-setup.svg",
}


def parse_front_matter(text):
    """Return (fields: dict, body: str) for YAML (---) or TOML (+++) front matter."""
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        fields = {}
        for line in fm.strip().splitlines():
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            key, _, value = line.partition(":")
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            fields[key.strip()] = value
        return fields, body.lstrip("\n")
    if text.startswith("+++"):
        _, fm, body = text.split("+++", 2)
        fields = {}
        for line in fm.strip().splitlines():
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            key, _, value = line.partition("=")
            fields[key.strip()] = value.strip().strip('"')
        return fields, body.lstrip("\n")
    raise ValueError("no front matter")


def parse_list(value):
    """Parse a simple TOML/YAML inline list like ["A", "B"]."""
    if not value:
        return []
    return [item.strip().strip('"').strip("'") for item in value.strip("[]").split(",") if item.strip()]


def quote(value):
    return '"' + value.replace('"', '\\"') + '"'


def convert(path):
    raw = path.read_text()
    fields, body = parse_front_matter(raw)

    name = path.name
    lang = "en"
    if name.endswith(".id.md"):
        lang = "id"
        slug = name[: -len(".id.md")]
    elif name.endswith(".en.md"):
        slug = name[: -len(".en.md")]
    else:
        slug = name[: -len(".md")]

    # Body transformations
    body = body.replace(
        '{{< ref "building-an-offline-first-react-web-app-using-watermelondb-in-phoenix-elixir.md" >}}',
        "/building-an-offline-first-react-web-app-using-watermelondb-in-phoenix-elixir/",
    )
    body = body.replace(
        '{{< ref "how-to-build-watermelondb-sync-backend-in-elixir.md" >}}',
        "/how-to-build-watermelondb-sync-backend-in-elixir/",
    )
    body = body.replace(
        '{{< ref "how-to-build-watermelondb-sync-backend-in-elixir.md#workaround-for-sync-on-client-side" >}}',
        "/how-to-build-watermelondb-sync-backend-in-elixir/#workaround-for-sync-on-client-side",
    )
    for old, new in PLANTUML.items():
        body = body.replace(old, new)

    # Hugo "hint" shortcodes -> GitHub alerts
    body = re.sub(
        r"\{\{<\s*hint\s+(\w+)\s*>\}\}\s*\n(.*?)\n\s*\{\{<\s*/hint\s*>\}\}",
        lambda m: "\n".join(
            [f"> [!{m.group(1).upper()}]"]
            + [f"> {line}" if line.strip() else ">" for line in m.group(2).splitlines()]
        ),
        body,
        flags=re.S,
    )

    tags = parse_list(fields.get("tags", ""))
    categories = parse_list(fields.get("categories", ""))
    merged_tags = []
    for tag in categories + tags:
        if tag not in merged_tags:
            merged_tags.append(tag)

    old_urls = []
    prefix = "/id/posts" if lang == "id" else "/posts"
    old_urls.append(f"{prefix}/{slug}/")
    aliases = parse_list(fields.get("aliases", ""))
    old_urls.extend(aliases)

    out = ["---"]
    out.append(f"title: {quote(fields.get('title', slug))}")
    out.append(f"date: {fields.get('date')}")
    out.append(f"draft: {'true' if fields.get('draft') == 'true' else 'false'}")
    out.append(f"lang: {lang}")
    out.append(f"id: {slug}")
    if lang == "id" or name.endswith(".en.md"):
        out.append(f"basename: {slug}")
    if merged_tags:
        out.append("tags:")
        for tag in merged_tags:
            out.append(f"  - {quote(tag)}")
    if slug in IMAGE:
        out.append(f"image: {IMAGE[slug]}")
    if slug in DESCRIPTION:
        out.append(f"description: {quote(DESCRIPTION[slug])}")
    out.append(f"giscusTerm: {prefix}/{slug}/")
    out.append("oldUrl:")
    for url in old_urls:
        out.append(f"  - {url}")
    out.append("---")
    out.append("")
    out.append(body.rstrip() + "\n")

    target = DST / "posts" / f"{slug}.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(out))
    print(f"{path.name} -> {target} ({lang})")


def main():
    for path in sorted((SRC / "posts").glob("*.md")):
        convert(path)

    # About page
    fields, body = parse_front_matter((SRC / "about.md").read_text())
    about = [
        "---",
        f"title: {quote(fields.get('title', 'About'))}",
        f"date: {fields.get('date')}",
        "lang: en",
        "id: about",
        "layout: layouts/page.vto",
        "menu:",
        "  visible: true",
        "  order: 2",
        "---",
        "",
        body.rstrip() + "\n",
    ]
    (DST / "about.md").write_text("\n".join(about))
    print("about.md -> about.md")


if __name__ == "__main__":
    main()
