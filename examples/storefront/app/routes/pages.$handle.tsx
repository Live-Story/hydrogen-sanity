import {useLoaderData} from 'react-router';
import groq, {defineQuery} from 'groq'
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import { PAGE_QUERY as SANITY_PAGE_QUERY } from "~/queries/sanity/page";
import { Query } from 'hydrogen-sanity';
import { CacheNone, CacheShort } from '@shopify/hydrogen';
import LiveStorySanity from 'livestory-sanity-sdk';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const language = context.storefront.i18n.language.toLowerCase();

  const [{page}, sanityPage] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        language: context.storefront.i18n.language,
        country: context.storefront.i18n.country,
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
    context.sanity.query(defineQuery(SANITY_PAGE_QUERY), { slug: params.handle, language }, {
      tag: 'page',
      hydrogen: {
        debug: {displayName: 'query Page'},
        cache: CacheNone(),
      },
    })
  ]);

  if (!page || !sanityPage) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    language,
    page,
    sanityPage
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page, sanityPage, language} = useLoaderData<typeof loader>();

  return (
    <div>
      {page.title && <h1>{page.title}</h1>}
      {sanityPage?.liveStory && 
        (
          <LiveStorySanity.Storefront.LiveStory
            value={sanityPage.liveStory}
            language={language}
          />
        )
      }
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
