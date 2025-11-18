import groq from "groq";

import { PAGE } from "./fragments/pages/page";

export const PAGE_QUERY = `
  coalesce(
    *[
      _type == 'page'
      && slug.current == $slug
      && (!defined(language) || language == $language)
    ][0],
  ) {
    ${PAGE}
  }
`;
