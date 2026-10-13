import { useEffect } from "react";

// Dependency-free per-route head management. react-helmet-async was avoided
// deliberately: its published versions have React 19 peer-dependency friction.
// Same mechanism as Helmet (head mutation in an effect) with full restore on
// unmount, so pages without Seo fall back to the static head in index.html.

const SITE = "The Harvest Theory";

function setMeta(key, attr, content, restore) {
  let el = document.head.querySelector(`meta[${key}="${attr}"]`);
  const existed = !!el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key, attr);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  restore.push({ el, existed, prev });
}

export default function Seo({
  title,
  description,
  type = "website",
  publishedTime,
  section,
  jsonLd,
}) {
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const prevTitle = document.title;
    const restore = [];

    document.title = title;
    setMeta("name", "description", description, restore);
    setMeta("property", "og:title", title, restore);
    setMeta("property", "og:description", description, restore);
    setMeta("property", "og:type", type, restore);
    setMeta("property", "og:site_name", SITE, restore);
    setMeta("name", "twitter:card", "summary", restore);
    setMeta("name", "twitter:title", title, restore);
    setMeta("name", "twitter:description", description, restore);
    if (publishedTime) setMeta("property", "article:published_time", publishedTime, restore);
    if (section) setMeta("property", "article:section", section, restore);

    let script = null;
    if (jsonLdStr) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "true");
      script.textContent = jsonLdStr;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      for (const { el, existed, prev } of restore) {
        if (existed) el.setAttribute("content", prev);
        else el.remove();
      }
      if (script) script.remove();
    };
  }, [title, description, type, publishedTime, section, jsonLdStr]);

  return null;
}
