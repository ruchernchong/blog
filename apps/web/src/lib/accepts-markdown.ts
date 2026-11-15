/**
 * Matches an `Accept` header that lists `text/markdown` as a whole media type
 * and does not decline it with `q=0`. Used as a `has` value by the rewrites in
 * next.config.ts, which anchor it to the full header value.
 */
export const ACCEPTS_MARKDOWN_PATTERN =
  "(?:.*,)?\\s*text/markdown(?![^,;\\s])(?![^,]*;\\s*q=0(?:\\.0{0,3})?\\s*(?:[;,]|$))(?:\\s*[;,].*)?";
