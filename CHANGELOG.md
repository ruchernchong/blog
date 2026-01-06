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
