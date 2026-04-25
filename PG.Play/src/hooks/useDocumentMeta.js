import { useEffect } from 'react';

// useDocumentMeta — sets document.title and the open-graph / twitter
// meta tags for the current route. On unmount it restores the previous
// values so a brief flash of "wrong" title doesn't appear on navigation.
//
// Pass null/undefined to fall back to the index.html defaults.

const SITE_URL = 'https://pushkalgupta.com/PG.Play/';
const OG_IMAGE = `${SITE_URL}og.png`; // see /public/og.svg + README for the conversion note

function ensureMeta(name, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(name, content, attr = 'name') {
  if (content == null) return;
  ensureMeta(name, attr).setAttribute('content', content);
}

export function useDocumentMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const prev = {
      title: document.title,
      description: document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
      ogTitle: document.head.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ogDescription: document.head.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      ogImage: document.head.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      ogUrl: document.head.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      twitterTitle: document.head.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      twitterDescription: document.head.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
      twitterImage: document.head.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    };

    if (title) document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', image || OG_IMAGE, 'property');
    setMeta('og:url', url || SITE_URL, 'property');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image || OG_IMAGE);

    return () => {
      document.title = prev.title;
      if (prev.description != null) setMeta('description', prev.description);
      if (prev.ogTitle != null) setMeta('og:title', prev.ogTitle, 'property');
      if (prev.ogDescription != null) setMeta('og:description', prev.ogDescription, 'property');
      if (prev.ogImage != null) setMeta('og:image', prev.ogImage, 'property');
      if (prev.ogUrl != null) setMeta('og:url', prev.ogUrl, 'property');
      if (prev.twitterTitle != null) setMeta('twitter:title', prev.twitterTitle);
      if (prev.twitterDescription != null) setMeta('twitter:description', prev.twitterDescription);
      if (prev.twitterImage != null) setMeta('twitter:image', prev.twitterImage);
    };
  }, [title, description, image, url]);
}
