## [1.20.0](https://github.com/ruchernchong/blog/compare/v1.19.0...v1.20.0) (2026-06-14)

### Features

* add OAuth provider ([b02b331](https://github.com/ruchernchong/blog/commit/b02b33165662f4aeb572ea6870ee11df46ab830d))
* add OAuth provider admin dashboard at /studio/oauth-clients ([80299c7](https://github.com/ruchernchong/blog/commit/80299c7db0a5676ad1de515b82501e4084e85bc3))
* add provider logo URLs ([75e9fe8](https://github.com/ruchernchong/blog/commit/75e9fe8279246b36ff790660d4d663c530b95b8d))
* add Redis secondary storage for Better Auth ([88ad8cd](https://github.com/ruchernchong/blog/commit/88ad8cdbcdc58d73aec2c3612e34341fd81bf1a1))
* add search, filters, and pagination to usage breakdown ([d9eea70](https://github.com/ruchernchong/blog/commit/d9eea7085d762c4dc709a37a8a305b457e7624a5))
* add stats footer to usage og image ([402ac27](https://github.com/ruchernchong/blog/commit/402ac2762b865c9daa3ea4bdf92fdc11e45a1677))
* add Upstash agent analytics ([c29e50f](https://github.com/ruchernchong/blog/commit/c29e50f49154237a1a859b5766662c080ba075b2))
* add usage provider metadata ([031504f](https://github.com/ruchernchong/blog/commit/031504f9001e1fe119b8a1a7bdbe77e09904eb80))
* align usage breakdown pagination with DataGrid footer pattern ([5c45378](https://github.com/ruchernchong/blog/commit/5c453781f1408f744e648e71503b28f411b957b6))
* arrange usage page as bento grid ([d2b889f](https://github.com/ruchernchong/blog/commit/d2b889f13f32d79ab87280edfb7108ed73309923))
* cache usage pricing ([99db398](https://github.com/ruchernchong/blog/commit/99db398849782de4b53758a3bf2c70f1b9bf9eb0))
* cache usage provider names ([30c1895](https://github.com/ruchernchong/blog/commit/30c189557fdc00925f2f35b91ce5cb4e5071d5ad))
* improve usage breakdown table ([43dc9ef](https://github.com/ruchernchong/blog/commit/43dc9ef948969e68dd262ccb42c69f931b6af96c))
* migrate to @better-auth/oauth-provider ([d54f6f4](https://github.com/ruchernchong/blog/commit/d54f6f4dad3dff841b73ec73338a35e96fc6195d))
* store sessions in database ([33aa4cb](https://github.com/ruchernchong/blog/commit/33aa4cbc61e408df90b5fd1c112339ec0265d692))

### Bug Fixes

* allow Vercel preview deployment URLs in allowedHosts ([99d67d2](https://github.com/ruchernchong/blog/commit/99d67d2d631b5a62d0521f28f716b741fdf53401))
* complete OAuth consent client-side so first attempt connects ([a08efc9](https://github.com/ruchernchong/blog/commit/a08efc9d0f533aa1351ba4e6e8246ad454680d67))
* harden OAuth provider and address PR review feedback ([6a59cba](https://github.com/ruchernchong/blog/commit/6a59cba5f999644035492a971c4368bd0ce9eac7))
* log consent APIError body and status, not empty message ([6ca77f8](https://github.com/ruchernchong/blog/commit/6ca77f8275d957413627343f8fc9f01ee53a8265))
* make future heatmap days non-interactive ([ee83760](https://github.com/ruchernchong/blog/commit/ee83760b0d05801c4f5b37828b695d880f6fa9cb))
* prevent layout shift when paging usage breakdown ([037317b](https://github.com/ruchernchong/blog/commit/037317b3afe645419a916770b5352040f4448434))
* redirect authenticated users with no OAuth context on consent page ([cca205e](https://github.com/ruchernchong/blog/commit/cca205e88d1a08448be5359e756a598a3a762ca9))
* redirect unauthenticated users on consent page and show client name ([02f6534](https://github.com/ruchernchong/blog/commit/02f6534faaf8c2df9264a01072dfb3396c9395ad)), closes [#325](https://github.com/ruchernchong/blog/issues/325)
* reject non-admin OAuth tokens on MCP route and fix refresh docs ([5ace6a1](https://github.com/ruchernchong/blog/commit/5ace6a1a34fe7216b6f92f1af452058c3b58836e))
* return consent APIError instead of throwing masked 500 ([169b046](https://github.com/ruchernchong/blog/commit/169b046875f5eb76a541e1d734986c93fa96d52b))
* use BETTER_AUTH_URL for JWT audience verification ([34273c5](https://github.com/ruchernchong/blog/commit/34273c5fe751b301e061cc8b4ea139d45d07ac60))
* use BETTER_AUTH_URL for protected resource metadata base URL ([78716f4](https://github.com/ruchernchong/blog/commit/78716f4df936314e6d12835fa9a414f13a2d6ad5))
* use session cookie check in Studio middleware ([1817f2d](https://github.com/ruchernchong/blog/commit/1817f2db33230914d81936bebaddd057c8186ab5))
* verify OAuth token audience against issuer, not bare origin ([c55a4a3](https://github.com/ruchernchong/blog/commit/c55a4a39a5ff776a4146c2015cead84aa08212f7))
* verify OAuth tokens via better-auth/oauth2 with explicit jwksUrl ([46aca73](https://github.com/ruchernchong/blog/commit/46aca7354b6ba1515d238aadb3b40642980782be))

## [1.19.0](https://github.com/ruchernchong/blog/compare/v1.18.0...v1.19.0) (2026-06-10)

### Features

* show usage last updated ([7a698a4](https://github.com/ruchernchong/blog/commit/7a698a48016ab5125567f98783ca231c8041fa0d))

## [1.18.0](https://github.com/ruchernchong/blog/compare/v1.17.0...v1.18.0) (2026-06-10)

### Features

* improve usage KPI cards ([9246a11](https://github.com/ruchernchong/blog/commit/9246a11d6bbf683594d14bd6549ef3488597a516))
* show usage heatmap hover stats ([e0b8a87](https://github.com/ruchernchong/blog/commit/e0b8a876684bd338cc37401507df60a88e63cc82))

### Bug Fixes

* format usage KPI currency ([916f85d](https://github.com/ruchernchong/blog/commit/916f85deb8bbcc59e43aaca1987c6a28cfbacdbd))

## [1.17.0](https://github.com/ruchernchong/blog/compare/v1.16.1...v1.17.0) (2026-06-10)

### Features

* replace usage breakdown chart with sortable metrics table ([4c501bb](https://github.com/ruchernchong/blog/commit/4c501bb4b93dbe7fd54dec165a563b894d2fd406))

## [1.16.1](https://github.com/ruchernchong/blog/compare/v1.16.0...v1.16.1) (2026-06-02)

### Bug Fixes

* update docs version during release ([01969e5](https://github.com/ruchernchong/blog/commit/01969e55229ed9b8f2ad52b685f1ec8ea6f8c992))

## [1.16.0](https://github.com/ruchernchong/blog/compare/v1.15.0...v1.16.0) (2026-06-02)

### Features

* convert project to monorepo ([1ad492d](https://github.com/ruchernchong/blog/commit/1ad492d4faa487b401c3e2c914e7c80a3c69cebc)), closes [#282](https://github.com/ruchernchong/blog/issues/282)

### Bug Fixes

* address monorepo review feedback ([4cde8e6](https://github.com/ruchernchong/blog/commit/4cde8e6f9425dd363e8a6e996abd05bf2ed69aef))

## [1.15.0](https://github.com/ruchernchong/blog/compare/v1.14.0...v1.15.0) (2026-05-31)

### Features

* add "Powered by PostHog" attribution to dashboard ([965d07c](https://github.com/ruchernchong/blog/commit/965d07c2ea50dcbd44a8b7e1d889c42d64de290b))
* add last updated timestamp from PostHog on dashboard ([4f65eb1](https://github.com/ruchernchong/blog/commit/4f65eb19b75c8bb1cd0f6f9f96b4ccb8ebc4d8ba))

### Bug Fixes

* replace isExternal with target and rel on PostHog link ([624cfa6](https://github.com/ruchernchong/blog/commit/624cfa6cc760f421c9d31771087804272d3796ce))
* scope PostHog queries to production host and Singapore timezone ([3fa8762](https://github.com/ruchernchong/blog/commit/3fa876286153720cd090f90eaa5d53ed4d5dde9d))
* use correct HogQL toTimeZone casing in visits query ([42b35bc](https://github.com/ruchernchong/blog/commit/42b35bc87e5e2dacf6dc41c95f27a65e66224d90))

## [1.14.0](https://github.com/ruchernchong/blog/compare/v1.13.1...v1.14.0) (2026-05-31)

### Features

* migrate analytics to @posthog/next package ([cff676f](https://github.com/ruchernchong/blog/commit/cff676fcc84cc5c20c2844f68b656464da6c4d89))

### Bug Fixes

* pass apiKey explicitly to PostHogProvider ([59be121](https://github.com/ruchernchong/blog/commit/59be1218c09c58671f8ea9eb687b6bd91186f3fb))
* route PostHog proxy traffic through EU ingest host ([bbc6501](https://github.com/ruchernchong/blog/commit/bbc650123b944f3a0afa8b1080ab6d302a56751b))

## [1.13.1](https://github.com/ruchernchong/blog/compare/v1.13.0...v1.13.1) (2026-05-31)

### Performance Improvements

* cache usage opengraph image at the CDN ([be02aa5](https://github.com/ruchernchong/blog/commit/be02aa5ec13c51c72744f90a4a480f3f8554b393))

## [1.13.0](https://github.com/ruchernchong/blog/compare/v1.12.1...v1.13.0) (2026-05-31)

### Features

* add /api/usage/ingest route for production usage ingestion ([e6a330c](https://github.com/ruchernchong/blog/commit/e6a330c3cb07f1cd9081101d55f513c5a8fad4a8))
* add /usage token-activity contribution heatmap ([237f896](https://github.com/ruchernchong/blog/commit/237f896221e8986ede1c1cdb34fee8baf4a83f60))
* add /usage token-usage profile page ([5255605](https://github.com/ruchernchong/blog/commit/525560501e3ddd5ac5b0f5df71f5c41d82fcb102))
* add auto-save for Content Studio and save_draft MCP tool ([1973c97](https://github.com/ruchernchong/blog/commit/1973c97fa48a38fa4ea1e8ce33f5f038e194b2ce))
* add auto-save for Content Studio drafts and save_draft MCP tool ([31f139f](https://github.com/ruchernchong/blog/commit/31f139f9c54a9a8b1bb428861a8f30721cf70a7e))
* add blog-voice skill for personal writing style ([7bba330](https://github.com/ruchernchong/blog/commit/7bba330dc9dc5a8585f2d6207feeb0407dab1181))
* add cache directives to query layer ([39b019e](https://github.com/ruchernchong/blog/commit/39b019e421ba3dd09b1a1c72e28c821a4ced8b7d))
* add cache invalidation on post and series mutations ([9319883](https://github.com/ruchernchong/blog/commit/9319883a4b13a8b8ea517016dea39f1f63fafd1a))
* add cached usage aggregation query ([948aa0f](https://github.com/ruchernchong/blog/commit/948aa0fc163d4eaad5f82ed264f391c3cdc597fa))
* add caching to icons, OG images, and metadata routes ([55e8764](https://github.com/ruchernchong/blog/commit/55e876465bfe0442fb76a040ec9136c8bd1061fb))
* add local token-usage ingestion script ([8817ba5](https://github.com/ruchernchong/blog/commit/8817ba5801de9a8874532f5faa54c247b749a0a8))
* add OG image for usage page with activity heatmap ([2b7c280](https://github.com/ruchernchong/blog/commit/2b7c28027ec33745a361182dbdfdd4ebc17e6fd4))
* add OpenCode agent to usage profile ([818da0f](https://github.com/ruchernchong/blog/commit/818da0fa3d7779e7ddd725e6cf45783db5a396c5))
* add provider dimension derived from agent ([19581b6](https://github.com/ruchernchong/blog/commit/19581b6903dbd7efb076dcde048823b99d9ad270))
* add remote blog MCP server config ([1fd3fea](https://github.com/ruchernchong/blog/commit/1fd3feaf125ee948f0dab82fa6d78226aab3ccd6))
* add token_usage daily aggregate schema ([d459606](https://github.com/ruchernchong/blog/commit/d4596066784d7da4eae2da792941c9af2bc32789))
* add token_usage table migration ([35e3ce6](https://github.com/ruchernchong/blog/commit/35e3ce654922c6b4c8c175c1369ff94523f84c33))
* add token-usage parsers, pricing and types ([e23c129](https://github.com/ruchernchong/blog/commit/e23c129be5865b2b04978f0fa356126c96b2345d))
* add Usage to site navigation ([1bd00a3](https://github.com/ruchernchong/blog/commit/1bd00a311f38cb1199a5ce1d80e90bd216fbfe66))
* consolidate usage breakdown into segmented card ([84a3f6f](https://github.com/ruchernchong/blog/commit/84a3f6f4541258070b13013b6d83cff67415e6b5))
* enable Next.js Cache Components ([681bbd2](https://github.com/ruchernchong/blog/commit/681bbd2bba1dbc04ad2cb362ed95bf33f19e1282))
* implement Better Auth token validation for MCP API ([f769301](https://github.com/ruchernchong/blog/commit/f7693015a3f0f3714f1ff6c74d4c1ea9423d5a69)), closes [#278](https://github.com/ruchernchong/blog/issues/278)
* migrate UI from shadcn to HeroUI v3 (OSS + Pro) ([def4046](https://github.com/ruchernchong/blog/commit/def40462eb90153e57183968c1b68487b38ef124))
* price OpenAI gpt-5.5-fast usage at the priority tier rate ([a8df0fa](https://github.com/ruchernchong/blog/commit/a8df0fa857149511ff57ef42feda6e76d29f50e9))
* split QuickStats for optimal caching with Suspense ([8de2183](https://github.com/ruchernchong/blog/commit/8de218313f7c6188952c02c028fdf3a0e6bcb65a))
* split usage heatmap into per-year full-width grids ([c42130c](https://github.com/ruchernchong/blog/commit/c42130caedecaad8948b824aa4bd7432c29392cf))

### Bug Fixes

* add --no-git-checks to allow pnpm version on dirty tree ([e537dc2](https://github.com/ruchernchong/blog/commit/e537dc2533024ec532cc04c24204054ac8b0f5b0))
* add missing cache invalidation in MCP post mutation handlers ([4e92cd1](https://github.com/ruchernchong/blog/commit/4e92cd11ca731acd052ee96fe0786932bc561448))
* correct OpenCode MCP auth env var syntax to {env:XXX} ([315cd46](https://github.com/ruchernchong/blog/commit/315cd4687f0c6fb49e070324b4d34a11eb7f17b2))
* reduce metrics rendering overhead ([efe342a](https://github.com/ruchernchong/blog/commit/efe342a6dcdf56378ce21ee91742a165d1b69ed0))
* remove 'use cache' from routes with serialization issues ([31e92a5](https://github.com/ruchernchong/blog/commit/31e92a53b31410b1fa22c9dc38a8ed56cfaa7d93))
* resolve 10s execution time on blog posts ([10ca1fd](https://github.com/ruchernchong/blog/commit/10ca1fd4fd249213cc33f3bff871c8ca5c094a34))
* resolve Cache Components compatibility issues ([8c98c0d](https://github.com/ruchernchong/blog/commit/8c98c0dc822cb32f7b6979a89eeaa39dbe849706))
* resolve Date.now() error in umami.ts ([2ca8da5](https://github.com/ruchernchong/blog/commit/2ca8da522ef1c3452c699f25d9ab6e5e6c2c0c05))
* use accent colour token for usage charts ([81eae78](https://github.com/ruchernchong/blog/commit/81eae78db81eab6fea24facc73bb613fe8e79cd7))

### Performance Improvements

* cache feed.xml, llms.txt, sitemap and add OG Cache-Control ([489ee6d](https://github.com/ruchernchong/blog/commit/489ee6d2671171150a3429fa16555b42d65f5560))
* cache Google Fonts for OG images ([e4804ba](https://github.com/ruchernchong/blog/commit/e4804baa2f9cdcfe4dc560f79b69268617a88559))
* optimise static rendering with ISR ([c24b751](https://github.com/ruchernchong/blog/commit/c24b751996efb205a1e26be0341288d35345cb56))

## [1.12.1](https://github.com/ruchernchong/blog/compare/v1.12.0...v1.12.1) (2026-01-06)

### Bug Fixes

* restrict studio access to admin only ([6272efd](https://github.com/ruchernchong/blog/commit/6272efddf5a559d039a23cce3bf870156fd11629))

## [1.12.0](https://github.com/ruchernchong/blog/compare/v1.11.0...v1.12.0) (2026-01-06)

### Features

* add blog MCP server ([f190199](https://github.com/ruchernchong/blog/commit/f1901993f5cc9fbc7babc4aad46a084404c70065))
* add custom 404 page ([9a4e1bd](https://github.com/ruchernchong/blog/commit/9a4e1bd0409c74db2babe765d163a1f89de24940))
* add draft preview for logged-in users ([3f00862](https://github.com/ruchernchong/blog/commit/3f00862ce523b486b5e7820f80afb469d5db6744))
* add MCP server for blog and media management ([1069b64](https://github.com/ruchernchong/blog/commit/1069b64554aea627ab7656d60e1accbb22a40165))
* add Mermaid diagram support to MDX posts ([41f2307](https://github.com/ruchernchong/blog/commit/41f23079a49dfee57948a22c43f828899e461918))
* add series feature for blog posts ([7a69b03](https://github.com/ruchernchong/blog/commit/7a69b033a97df9e6e436db7d219d4a4b96eded00))
* add sidebar to studio layout ([dd53da9](https://github.com/ruchernchong/blog/commit/dd53da9a7dd63dd578b6936cfd0ac8486bb476e4))
* add split panel editor with preview ([a307ad1](https://github.com/ruchernchong/blog/commit/a307ad152e539ba535247ccae99109f7e4afb61e))
* integrate Umami analytics ([a2c76fb](https://github.com/ruchernchong/blog/commit/a2c76fb7da91c583f684e4e2bb6ce44a132e5e46))

### Bug Fixes

* add code block support to MDX editor ([adcfa2e](https://github.com/ruchernchong/blog/commit/adcfa2e1a6ce5918ddc9e64ac13318b70ac9665c))
* add thematic break support to editor ([ba0affb](https://github.com/ruchernchong/blog/commit/ba0affbdd360ea9298071cac7de946e601f0fad5))
* enable git credentials for release ([7ab3cbf](https://github.com/ruchernchong/blog/commit/7ab3cbf8924da3154411a3abed30bb778682cb49))
* remove cache from MDX component ([49dec76](https://github.com/ruchernchong/blog/commit/49dec768726b0e5e135d50a04f39ccc3cb375859))
* remove dark prose invert from editor ([b09411c](https://github.com/ruchernchong/blog/commit/b09411c1c5d589a96fc114cec21a0d9fa5255c22))
* use pnpm version in release config ([8f372ca](https://github.com/ruchernchong/blog/commit/8f372caf966e592c900f70ba51675b70a6ebd698))
* wrap async content in Suspense ([a3d7b3a](https://github.com/ruchernchong/blog/commit/a3d7b3a146193187d5e7b2de9b9aea8d88663303))

### Performance Improvements

* cache OG images and fonts ([c0aa915](https://github.com/ruchernchong/blog/commit/c0aa9153e0ab6d9d0dc43a44ac58665790ff079f))
* **dashboard:** cache stats grid component ([5694003](https://github.com/ruchernchong/blog/commit/56940038a560771761c269fb378185d83ce38546))
* use draftMode for blog post preview ([b0db8db](https://github.com/ruchernchong/blog/commit/b0db8db95173f2532adc3061b57eaac6276723b6))

## [1.11.0](https://github.com/ruchernchong/portfolio/compare/v1.10.2...v1.11.0) (2025-12-20)

### Features

* add employment timeline with roles ([a1574d3](https://github.com/ruchernchong/portfolio/commit/a1574d323b931cd2a64b9c09b87ab15c2e2645b1))
* add icons to page titles ([0101b2e](https://github.com/ruchernchong/portfolio/commit/0101b2eb51829b1acc322563dfc390ec6d8f59b9))
* add media library with R2 storage ([4647e1a](https://github.com/ruchernchong/portfolio/commit/4647e1a581ee98969f6733b674ee374d16a3fd88))
* add page-specific gradient orbs to about ([a7832c7](https://github.com/ruchernchong/portfolio/commit/a7832c7155321edf5d525eb845523d3fecd4601b))
* add scroll progress indicator to articles ([e1a617a](https://github.com/ruchernchong/portfolio/commit/e1a617a0191257060243d4d05e4b6db2421ba249))
* add web app manifest ([7630ea8](https://github.com/ruchernchong/portfolio/commit/7630ea8de513db06b96a6578e837c2a35157722e))
* enable typed routes and MCP server ([53959f2](https://github.com/ruchernchong/portfolio/commit/53959f2ba22d92482955ce20ba6f156570bc8c17))
* filter R2-deleted media from library ([4976b2b](https://github.com/ruchernchong/portfolio/commit/4976b2bfdcc529cbaf5d825c60c899757dad508f))
* implement coral design system ([45c4613](https://github.com/ruchernchong/portfolio/commit/45c46134e37e079eeec3384a3da2c403beb36c50))
* integrate MDXEditor for content editing ([7a6daf2](https://github.com/ruchernchong/portfolio/commit/7a6daf208db49640e6579c72586b2b77752d8495))
* migrate to Base UI with Maia style ([e7de4ac](https://github.com/ruchernchong/portfolio/commit/e7de4ac4e3f0367d7602d74201507de4ff62b254))
* redesign blog page with tag filter ([19ef62a](https://github.com/ruchernchong/portfolio/commit/19ef62a0400bf609b7275d522e94c58521834f07))
* revamp dashboard with new components ([dd47abb](https://github.com/ruchernchong/portfolio/commit/dd47abb116ffdeae4f18b3e4bfe9e9eec752ad1a))
* revamp landing page with new components ([bc0692a](https://github.com/ruchernchong/portfolio/commit/bc0692abfa0d6d12e3c5a774b8e4d1efcab54e38))
* revamp projects page with DLS ([177919a](https://github.com/ruchernchong/portfolio/commit/177919ae22e9014b216cedc5b074fb9b4100b500))
* run convex:dev with dev task ([d60d992](https://github.com/ruchernchong/portfolio/commit/d60d992765ea192ca6a2cc56a59a42c37eda0daa))
* set up convex ([cd4fd94](https://github.com/ruchernchong/portfolio/commit/cd4fd940564f71da051e2cda82e2e3cea8671c65))

### Bug Fixes

* add nativeButton prop to Link buttons ([83010d0](https://github.com/ruchernchong/portfolio/commit/83010d0baefaab91279cd9cf9db2687ac28c1798))
* configure serverExternalPackages for MDX ([6a09ece](https://github.com/ruchernchong/portfolio/commit/6a09ece054d1241ed586c0e828d57eee729e9004))
* remove cover image from featured post ([441f6e0](https://github.com/ruchernchong/portfolio/commit/441f6e0293a5b35c5ab59acd0f9ba659a0b65c68))
* remove fill-foreground from section icons ([e9d0133](https://github.com/ruchernchong/portfolio/commit/e9d0133bb437f06873ab5d52b59cd3a447c16eb7))
* simplify OAuth to Google with proxy support ([51d8124](https://github.com/ruchernchong/portfolio/commit/51d81245d54c7f52578893142e360952ee90bd17))
* use bun pm version in release ([da90ab3](https://github.com/ruchernchong/portfolio/commit/da90ab385f4a5bf189e2f7c5cc13ace17bf6b369))
* use correct cache invalidation method ([7907053](https://github.com/ruchernchong/portfolio/commit/7907053f1e31e165e39f3f6348a442ca4745a8d1))

## [1.10.2](https://github.com/ruchernchong/portfolio/compare/v1.10.1...v1.10.2) (2025-10-24)

### Bug Fixes

* blog posts links in sitemap ([25a87d8](https://github.com/ruchernchong/portfolio/commit/25a87d82b4b9add9ac2a197584360b9450f66146))

## [1.10.1](https://github.com/ruchernchong/portfolio/compare/v1.10.0...v1.10.1) (2025-10-24)

### Bug Fixes

* base url ([b1705ef](https://github.com/ruchernchong/portfolio/commit/b1705efb5bd78ad81a9086d775a8d8ff735330e5))

## [1.10.0](https://github.com/ruchernchong/portfolio/compare/v1.9.0...v1.10.0) (2025-10-24)

### Features

* implement popular and related posts with Upstash Redis ([5f9b374](https://github.com/ruchernchong/portfolio/commit/5f9b3742dedccef2e0a8414226ee31b316bd07db))

### Bug Fixes

* add explicit compare function for tag sorting ([ef4e52b](https://github.com/ruchernchong/portfolio/commit/ef4e52ba0c9809928a83e44ad74363af36080247))

## [1.9.0](https://github.com/ruchernchong/portfolio/compare/v1.8.0...v1.9.0) (2025-10-24)

### Features

* include studio in dev script for content management ([0dec186](https://github.com/ruchernchong/portfolio/commit/0dec1860da6b1c5aa9d2e11f087d6167234be266))

## [1.8.0](https://github.com/ruchernchong/portfolio/compare/v1.7.0...v1.8.0) (2025-10-24)

### Features

* link blog posts to user authors ([03c10a1](https://github.com/ruchernchong/portfolio/commit/03c10a1f2539417bd8ff99ac8ecba2a541149201))

### Bug Fixes

* resolve hydration error in UserMenu component ([6162544](https://github.com/ruchernchong/portfolio/commit/6162544540c67c3fbe3dc3aa2e746758637b5aa1))

## [1.7.0](https://github.com/ruchernchong/portfolio/compare/v1.6.0...v1.7.0) (2025-10-24)

### Features

* implement soft-delete for blog posts with restore functionality ([e994e50](https://github.com/ruchernchong/portfolio/commit/e994e507213be540e8371ed1f8a3d21807f0fcbe))

## [1.6.0](https://github.com/ruchernchong/portfolio/compare/v1.5.0...v1.6.0) (2025-10-24)

### Features

* add dynamic llms.txt route for LLM SEO ([7b79c6e](https://github.com/ruchernchong/portfolio/commit/7b79c6e04852a90bfcfb53332f09e96e083541c9))
* add React 19.2 features ([b87e3e3](https://github.com/ruchernchong/portfolio/commit/b87e3e34917e2a9707854f9734dd5394bc4e87b1))

## [1.5.0](https://github.com/ruchernchong/portfolio/compare/v1.4.9...v1.5.0) (2025-10-22)

### Features

* add Better Auth with OAuth providers ([db6ed7a](https://github.com/ruchernchong/portfolio/commit/db6ed7ab45a5c4125999016695f8dda42e03fc82))
* add comprehensive error handling and validation to CMS ([323ea80](https://github.com/ruchernchong/portfolio/commit/323ea80df059b7ddaf5b9f8e461baed5ab81e780))
* add content studio CMS with database schema ([a061de9](https://github.com/ruchernchong/portfolio/commit/a061de963ead264d55f725b66ec562f1b7829087))
* add database seeding with Drizzle Seed ([acaa307](https://github.com/ruchernchong/portfolio/commit/acaa3076970ca0c8bd46bf0fa04a1564b4c431cd))
* add drizzle-kit database commands ([9e58dac](https://github.com/ruchernchong/portfolio/commit/9e58dac95b977f1f4419f458d0d4ffde008b9eab))
* add posts table migration for CMS ([8ba3cfe](https://github.com/ruchernchong/portfolio/commit/8ba3cfe24bbbe2d046fe4b1acc7f186b459ff876))
* **blog:** add About Me in landing page ([844c9e5](https://github.com/ruchernchong/portfolio/commit/844c9e5494319fac846f60fc93c863900f40489e))
* **blog:** add announcement component ([0523db6](https://github.com/ruchernchong/portfolio/commit/0523db6ca6a17273f2e9b53088bbd16f94790802))
* **blog:** add beta tag in the header ([b10d873](https://github.com/ruchernchong/portfolio/commit/b10d87329a2852c4affa1b433b6a13645cdc04db))
* **blog:** add post 'patching critical third-party risks you don't control' ([832483b](https://github.com/ruchernchong/portfolio/commit/832483ba7232b663e5ab3a541c03eb115ec2b8a2))
* **blog:** add projects details page ([6ab14c3](https://github.com/ruchernchong/portfolio/commit/6ab14c3dee597f00783c185d82c183192b783fd6))
* **blog:** add site metrics to dashboard ([fde0754](https://github.com/ruchernchong/portfolio/commit/fde0754c2cb8a2de91dfe51182d85b584b41fbb0))
* **blog:** add total site visits metric to dashboard ([57e9c4c](https://github.com/ruchernchong/portfolio/commit/57e9c4c09a5b6f350567050a16ef6a534e104fb6))
* **blog:** add View Transition API ([8f93f55](https://github.com/ruchernchong/portfolio/commit/8f93f55b55fa8f99d29f518aec32616d51e93f32))
* migrate blog from Contentlayer to database-backed Content Studio ([1100863](https://github.com/ruchernchong/portfolio/commit/110086369c429f22fe69b91dd6f4ac30626865c1)), closes [#241](https://github.com/ruchernchong/portfolio/issues/241)
* use OAuth Proxy ([0b3a905](https://github.com/ruchernchong/portfolio/commit/0b3a905da66fed7cef7179e4b5654d781a326d59))

### Bug Fixes

* **blog:** add projects to sitemap ([bdd9611](https://github.com/ruchernchong/portfolio/commit/bdd9611aa1462cd85d37b4d3f872c63ff3a5903e))
* **blog:** build errors ([a3f6c28](https://github.com/ruchernchong/portfolio/commit/a3f6c28a645301c2ea54fa0500e8a2d7eb24f0c5))
* **blog:** temporary remove contributions ([4c9e11c](https://github.com/ruchernchong/portfolio/commit/4c9e11c1ed58659244120af93e827e67720862f9))
* disable commitlint footer rules ([f52df26](https://github.com/ruchernchong/portfolio/commit/f52df26b579b52aaa399d32bce724ddaf11a73a0))
* remove baseURL from auth client config ([6b353d0](https://github.com/ruchernchong/portfolio/commit/6b353d04476925ef94b8a9a57f0ce6260fac1499))
* remove validation for BETTER_AUTH_SECRET ([c8878b5](https://github.com/ruchernchong/portfolio/commit/c8878b5ebde80145bdc9a91c9a6014319134af2d))
* set turborepo to loose mode for env ([65a3c4d](https://github.com/ruchernchong/portfolio/commit/65a3c4d056b23e5d509e408007f4b5b67f6f0d59))
* studio post edit API route issues ([7122dae](https://github.com/ruchernchong/portfolio/commit/7122daec20934f166a2ea359b00c64c9dfc2ec34))
* use BETTER_AUTH_URL for OAuth redirects ([e213540](https://github.com/ruchernchong/portfolio/commit/e21354016e0490f1e6c76a45ad05e1ab73e9b838))
* use env-based URL in seed metadata ([cb6755e](https://github.com/ruchernchong/portfolio/commit/cb6755e479091af1a330ad9d2c4c3c52a35b9d97))
