## [1.53.0](https://github.com/ruchernchong/blog/compare/v1.52.0...v1.53.0) (2026-09-26)

### Features

* drop legacy handling from the agent-usage installer ([0ecf672](https://github.com/ruchernchong/blog/commit/0ecf672cddb724dd8eba7a459e66785911b2614c))
* merge the agent-usage installers into install.sh ([9e79950](https://github.com/ruchernchong/blog/commit/9e79950cf8f94e104f12cb190032ad0114d44919))
* remove the legacy installer forwarder ([7a4b50e](https://github.com/ruchernchong/blog/commit/7a4b50e340dc2bc06e6ef8664c6f0f7a8377d498))

## [1.52.0](https://github.com/ruchernchong/blog/compare/v1.51.0...v1.52.0) (2026-09-26)

### Features

* accept only OAuth tokens for usage ingest ([973e469](https://github.com/ruchernchong/blog/commit/973e469fd4816d64cec23d9b2f3b8b25235bfd5b))

## [1.51.0](https://github.com/ruchernchong/blog/compare/v1.50.0...v1.51.0) (2026-09-26)

### Features

* add a proper command tree to agent-usage ([93412eb](https://github.com/ruchernchong/blog/commit/93412eb1acde143db761a97ff3e365b713a607bc))
* keep agent-usage config in its own directory ([411df0e](https://github.com/ruchernchong/blog/commit/411df0e8004b3ed380cd06c74dbd09e7dab9e5e0))
* let agent-usage update itself ([1486279](https://github.com/ruchernchong/blog/commit/1486279598029739d29633da5ecaa5e4cc186efb))
* rename the usage collector to agent-usage ([81dbf57](https://github.com/ruchernchong/blog/commit/81dbf57c783b911df45078bd57db67efd263284b))

## [1.50.0](https://github.com/ruchernchong/blog/compare/v1.49.1...v1.50.0) (2026-09-26)

### Features

* ingest usage with the Rust collector ([90f0cdd](https://github.com/ruchernchong/blog/commit/90f0cdddc97478070d9bff316d67c79bd1cc552c))
* prompt to update the usage collector ([d4a4d62](https://github.com/ruchernchong/blog/commit/d4a4d6237460a8c94114fcc9701c50c2dac279b2))

## [1.49.1](https://github.com/ruchernchong/blog/compare/v1.49.0...v1.49.1) (2026-09-26)

### Bug Fixes

* price GPT-5.6 from list-price sources ([5d099ad](https://github.com/ruchernchong/blog/commit/5d099ad79288d9dcd2c1f001fdb6becca8891685))
* resolve -build model slugs to their base model ([ce8a035](https://github.com/ruchernchong/blog/commit/ce8a035e1264e1de60363357f4418ae9451b95a7))
* skip model display names that echo the slug ([c2979f1](https://github.com/ruchernchong/blog/commit/c2979f1068eded5179235d34c552de836935ecd7))

## [1.49.0](https://github.com/ruchernchong/blog/compare/v1.48.0...v1.49.0) (2026-09-26)

### Features

* add open weights filter to the usage explorer ([edcd917](https://github.com/ruchernchong/blog/commit/edcd9173053787907408c5e9567c17d37fb0b179))
* fit open weights chips in the explorer model column ([b5a6c69](https://github.com/ruchernchong/blog/commit/b5a6c691fd197c64cc5d470c53d5b91e0b88f292))
* keep stored open weights when an update omits it ([0c38d18](https://github.com/ruchernchong/blog/commit/0c38d1882cc3d6da26116f2d75d544c446fe382e))

### Bug Fixes

* skip schema tests when loading the drizzle config ([df00dcf](https://github.com/ruchernchong/blog/commit/df00dcf5d30fabf29b158c68e7ab83ad5352d013))

## [1.48.0](https://github.com/ruchernchong/blog/compare/v1.47.4...v1.48.0) (2026-09-26)

### Features

* group stack chart models by family ([0f8dfce](https://github.com/ruchernchong/blog/commit/0f8dfceb98b36a17dc1ff4fbd7e3bc4fe5af3afc))

## [1.47.4](https://github.com/ruchernchong/blog/compare/v1.47.3...v1.47.4) (2026-09-25)

### Bug Fixes

* log failed series loads with the error id ([b8898c1](https://github.com/ruchernchong/blog/commit/b8898c11ea4f4a1134aa58bfba1d45ad1f2950c0))
* resolve sonar issues on new code ([1b25325](https://github.com/ruchernchong/blog/commit/1b253257dd36fae90467b40d5c6f053ef018ed92))
* show an error when series fail to load ([0db7673](https://github.com/ruchernchong/blog/commit/0db76739fff8c6cf7a746d5c9b09fdfdade71002))
* stop nesting flow content inside output ([8ec18ba](https://github.com/ruchernchong/blog/commit/8ec18ba2cf04aa03bef20c242a4e3882c7285316))

## [1.47.3](https://github.com/ruchernchong/blog/compare/v1.47.2...v1.47.3) (2026-09-25)

### Bug Fixes

* **usage:** tidy the Usage page on phones ([871da0e](https://github.com/ruchernchong/blog/commit/871da0e135f97a21d73be1efaac87fb002c81f0d))

### Reverts

* keep fumadocs scaffold page untouched ([d0fae54](https://github.com/ruchernchong/blog/commit/d0fae542643470491c0bd8647afc5818ddd904d8))

## [1.47.2](https://github.com/ruchernchong/blog/compare/v1.47.1...v1.47.2) (2026-09-25)

### Bug Fixes

* freeze usage breakdown header and model column ([ba3ed21](https://github.com/ruchernchong/blog/commit/ba3ed2170047bc0325273f6b584c2f6adcfa9520))

## [1.47.1](https://github.com/ruchernchong/blog/compare/v1.47.0...v1.47.1) (2026-09-25)

### Bug Fixes

* align model character tests and date ([1edaee3](https://github.com/ruchernchong/blog/commit/1edaee3bfe1e8004642e432da9ad7bb076cbd72d))
* let equal-total ingest update reasoning ([8247bd2](https://github.com/ruchernchong/blog/commit/8247bd2d5809c6eef18064339f9cd34a3a647ca0))
* replace broken model character columns ([e4b7ac7](https://github.com/ruchernchong/blog/commit/e4b7ac770c7a29427687f3cb2ad6a891a6de6a4f))
* split claude thinking after merging repeats ([e01c633](https://github.com/ruchernchong/blog/commit/e01c633447ab3a0cdad54863a1dd8d7db5d4fa0b))
* split claude thinking tokens from output ([b75e33b](https://github.com/ruchernchong/blog/commit/b75e33b638a64b1dd16a467afd13af21f0c3fc8f))

## [1.47.0](https://github.com/ruchernchong/blog/compare/v1.46.0...v1.47.0) (2026-09-25)

### Features

* split multi-provider models into expandable rows ([ad532ee](https://github.com/ruchernchong/blog/commit/ad532ee372f42dbce3ceb23d6f53a54de16f8cfa))

### Bug Fixes

* apply provider filter to model splits ([1b6d52d](https://github.com/ruchernchong/blog/commit/1b6d52da6166bf98f0ad1d5365e4b292015173bb))
* collapse extra providers into a summary line ([7e83cad](https://github.com/ruchernchong/blog/commit/7e83cadfbfaeac20f722f2baaa915abc58dac60d))
* show provider count on expandable model rows ([7ff2d98](https://github.com/ruchernchong/blog/commit/7ff2d982eea903daa72b5b41e9253df6cbb11fd2))
* stack multiple providers in explorer grid ([ac09a6f](https://github.com/ruchernchong/blog/commit/ac09a6ffe36b54872b0fa3bd171b97416f5a8305))

## [1.46.0](https://github.com/ruchernchong/blog/compare/v1.45.4...v1.46.0) (2026-09-25)

### Features

* finish usage narrative stream at 1.2s ([fd9fcac](https://github.com/ruchernchong/blog/commit/fd9fcacc7236481ce7e73adf9efae90289d1fa92))
* stream usage narrative word by word ([9a15dad](https://github.com/ruchernchong/blog/commit/9a15dad7e8ebc50ff6d3f36dda4a09b173b0d259))

## [1.45.4](https://github.com/ruchernchong/blog/compare/v1.45.3...v1.45.4) (2026-09-24)

### Bug Fixes

* redesign usage og image to stop clipping ([d42ff08](https://github.com/ruchernchong/blog/commit/d42ff08a6b28cf4c2bb9d4af589fe2569a738fbd))
* truncate long model names in usage og image ([6488bcb](https://github.com/ruchernchong/blog/commit/6488bcb02f96035f7ac41861e2e5cd188f0cc4d9))
* truncate model names by code point ([b5bb039](https://github.com/ruchernchong/blog/commit/b5bb0395f9ac4e0958059203f5083d6e1221a7c2))

## [1.45.3](https://github.com/ruchernchong/blog/compare/v1.45.2...v1.45.3) (2026-09-24)

### Bug Fixes

* right-align numeric columns in usage explorer ([302c203](https://github.com/ruchernchong/blog/commit/302c203d1c3088288d38ee105770dab441aed21e))

## [1.45.2](https://github.com/ruchernchong/blog/compare/v1.45.1...v1.45.2) (2026-09-24)

### Bug Fixes

* fill token mix bar to full width ([7f49cea](https://github.com/ruchernchong/blog/commit/7f49ceabaa6a7a70e64ef3316641f0a8d5fbce36))

## [1.45.1](https://github.com/ruchernchong/blog/compare/v1.45.0...v1.45.1) (2026-09-24)

### Bug Fixes

* hide unused models in stack chart tooltip ([9af824f](https://github.com/ruchernchong/blog/commit/9af824f9c41b85c1b09b4724d275e71db39ca409))
* hoist stack chart tooltip out of render ([8dff939](https://github.com/ruchernchong/blog/commit/8dff939c62a6dbe670ae45a9a000aed4ea5b0c11))
* show stack chart tooltip on idle weeks ([d51fbd2](https://github.com/ruchernchong/blog/commit/d51fbd29f0101bdc0d548cb1c1bec502de6e45b2))
* sort stack chart tooltip by share ([3e157e4](https://github.com/ruchernchong/blog/commit/3e157e4011ad2e9077606870fef86c9a0bd82138))
* stack chart tooltip, idle gaps and ticks ([c40f4ce](https://github.com/ruchernchong/blog/commit/c40f4ce2d2dae1dbe76848e2be63e25078bd8c24))

## [1.45.0](https://github.com/ruchernchong/blog/compare/v1.44.0...v1.45.0) (2026-09-24)

### Features

* **usage:** highlight key figures in the hero narrative with the accent colour ([a171e01](https://github.com/ruchernchong/blog/commit/a171e014ea22bd91b4cdcf73ddf0b4a5ccd38894))

## [1.44.0](https://github.com/ruchernchong/blog/compare/v1.43.0...v1.44.0) (2026-09-24)

### Features

* show every usage explorer column by default ([9d02913](https://github.com/ruchernchong/blog/commit/9d0291368b3362f6b1c27d011986ea39ece036a6))

## [1.43.0](https://github.com/ruchernchong/blog/compare/v1.42.0...v1.43.0) (2026-09-24)

### Features

* add usage explorer phone list and model drawer ([8113cdb](https://github.com/ruchernchong/blog/commit/8113cdb15b126f04bdd31dbbe03d3f6bc096834d))
* add usage insight aggregations for page redesign ([5461f19](https://github.com/ruchernchong/blog/commit/5461f198011b7dfd35886724a0ad90df7f6f50d5))
* add usage story sections to the redesigned page ([e688590](https://github.com/ruchernchong/blog/commit/e6885906a0efbea5c4f729fd77a2837de006265c))
* polish usage redesign with OG image, docs and a11y ([249f11b](https://github.com/ruchernchong/blog/commit/249f11baebc421328947cbf9ab2605cc99863c7e))
* redesign usage page shell with editorial hero ([afa3e78](https://github.com/ruchernchong/blog/commit/afa3e7877b91a081370c01729fc0ffa78b78f5ac))
* roomier usage explorer and profile buttons in model character ([38de1dd](https://github.com/ruchernchong/blog/commit/38de1dd48af3fe484199351a3ff014d4e50b7c54))

### Bug Fixes

* address usage review findings ([b19065f](https://github.com/ruchernchong/blog/commit/b19065fb527ee75896aca102bf39a812d1f5d905))
* don't persist the locked sort column as a visibility choice ([785ddbf](https://github.com/ruchernchong/blog/commit/785ddbf3e7b1f033af92e67f6caabedbc4724b05))
* pre-bundle browser test deps and sort usage dates explicitly ([6c6a008](https://github.com/ruchernchong/blog/commit/6c6a00843c132e681bab0318b94a29a9f045fbeb))
* reach every model profile from Model character ([bc267fe](https://github.com/ruchernchong/blog/commit/bc267fe3fe5721c3fb4d79f8048bb151dccad7c1))
* usage sort labels, locked sorted column, spacing scale ([81b46b7](https://github.com/ruchernchong/blog/commit/81b46b734b3385d264d214594b8c53a10a9b8e76))

## [1.42.0](https://github.com/ruchernchong/blog/compare/v1.41.1...v1.42.0) (2026-09-24)

### Features

* add curl installer for usage collector ([b43706b](https://github.com/ruchernchong/blog/commit/b43706b988d2ee44c10bf698489099d62dbf9321))
* bump workspace versions in lockstep ([2ab1163](https://github.com/ruchernchong/blog/commit/2ab11637917426bacad5b9384d71dbebfe8743aa))
* keep package versions unchanged ([213d844](https://github.com/ruchernchong/blog/commit/213d8447722c25f16f814ed8111ba1d012ab38f7))

## [1.41.1](https://github.com/ruchernchong/blog/compare/v1.41.0...v1.41.1) (2026-09-19)

### Bug Fixes

* stream registry sync events and retry reprice ([a302acb](https://github.com/ruchernchong/blog/commit/a302acbdf239500efe47a513c009cba29d0ee69b))

## [1.41.0](https://github.com/ruchernchong/blog/compare/v1.40.0...v1.41.0) (2026-09-16)

### Features

* fold model aliases into one usage row ([6459220](https://github.com/ruchernchong/blog/commit/6459220fa3be9a02e8ce925f7965cb1c9d2b08e6))

## [1.40.0](https://github.com/ruchernchong/blog/compare/v1.39.0...v1.40.0) (2026-09-16)

### Features

* add grok usage parser to rust collector ([46054c8](https://github.com/ruchernchong/blog/commit/46054c8f9894c5c61a6658026f5458328a9b3be0))

## [1.39.0](https://github.com/ruchernchong/blog/compare/v1.38.2...v1.39.0) (2026-09-16)

### Features

* derive usage cost at read time ([93c33e0](https://github.com/ruchernchong/blog/commit/93c33e07732b648baf822b21e1ffd7d452aa339f)), closes [#343](https://github.com/ruchernchong/blog/issues/343)

### Bug Fixes

* register usage cost parity script ([394a0a2](https://github.com/ruchernchong/blog/commit/394a0a26c5f3942c130a9e7c91b4ffc6e6c9b7a9)), closes [#343](https://github.com/ruchernchong/blog/issues/343)

## [1.38.2](https://github.com/ruchernchong/blog/compare/v1.38.1...v1.38.2) (2026-09-16)

### Bug Fixes

* show oauth errors on the login page ([575f944](https://github.com/ruchernchong/blog/commit/575f944ffc46b37594dec870808c0847ba083b44)), closes [#326](https://github.com/ruchernchong/blog/issues/326)

## [1.38.1](https://github.com/ruchernchong/blog/compare/v1.38.0...v1.38.1) (2026-09-16)

### Bug Fixes

* frame usage cost as API equivalent ([70cbe97](https://github.com/ruchernchong/blog/commit/70cbe975d98ba02e166823ecebe0057216f2ef15))

## [1.38.0](https://github.com/ruchernchong/blog/compare/v1.37.1...v1.38.0) (2026-09-14)

### Features

* log run timing and shorten ingest interval to 15m ([96c3d71](https://github.com/ruchernchong/blog/commit/96c3d71bb22570420eef534f8c27c8e2ce8f27ed))
* replace go usage collector with rust ([cde7a15](https://github.com/ruchernchong/blog/commit/cde7a15ac44c81806dedf5b25893c4d109a9575d))
* scaffold rust usage collector crate ([6d4f84b](https://github.com/ruchernchong/blog/commit/6d4f84b4b3116093887c24a3540ee1b7d1635517))

## [1.37.1](https://github.com/ruchernchong/blog/compare/v1.37.0...v1.37.1) (2026-09-13)

### Bug Fixes

* correct token counting in usage parsers ([527de09](https://github.com/ruchernchong/blog/commit/527de09a011f63673b08227ce1dde0c7ef226f12))
* keep ingesting when one parser or file fails ([be40103](https://github.com/ruchernchong/blog/commit/be4010373fa405b764d2b2b75a55008064b85289))
* serialise oauth token refresh across runs ([e3522d5](https://github.com/ruchernchong/blog/commit/e3522d5bd2ca367308faa07f7a8fd63d55ff31b7))

## [1.37.0](https://github.com/ruchernchong/blog/compare/v1.36.0...v1.37.0) (2026-09-13)

### Features

* add better-auth 1.7 schema migration ([3dc955b](https://github.com/ruchernchong/blog/commit/3dc955bb9b51586b118315b1296d8e13b51788fa))
* add Go usage collector with OAuth ([96fb791](https://github.com/ruchernchong/blog/commit/96fb7916996303b9632816c82119557769b4eed2))
* add token_effort_usage schema and effort ingest Zod ([199227a](https://github.com/ruchernchong/blog/commit/199227a20551eb69fc6050d521f3c56b5d732c9e))
* add token_effort_usage schema and effort ingest Zod ([f240149](https://github.com/ruchernchong/blog/commit/f240149dff863197f9e51054ba23af51efa07c62))
* add token_effort_usage schema and effort ingest Zod ([9eb44b0](https://github.com/ruchernchong/blog/commit/9eb44b0ff9857dd7b4bf518e81a87dcd6bf72130))
* map oauth clients to 1.7 auth fields ([0b08abe](https://github.com/ruchernchong/blog/commit/0b08abe65050d7c50a5771c0ad0142e9cbafc3bf))
* rename usage search params to nuqs docs convention ([0887057](https://github.com/ruchernchong/blog/commit/08870570228a92da619d42713d5d1c60ac9024f1))
* show all-time effort levels on /usage ([f8e1df6](https://github.com/ruchernchong/blog/commit/f8e1df6a1d87b8de84ce3ae80c526dcf8cc5611b))
* sync usage filters to url with nuqs ([c724757](https://github.com/ruchernchong/blog/commit/c724757aa60447f9fcd8c7510e8c457eea20f3d9))
* tidy usage search params naming and types ([fb21e35](https://github.com/ruchernchong/blog/commit/fb21e35be12c84388743fceb34a229f05fca9a43))
* upsert effortRows on usage ingest ([d0bb0af](https://github.com/ruchernchong/blog/commit/d0bb0af3ef9d3ffa2aaf575a5bdfe604f1c45157))
* upsert effortRows on usage ingest ([649fc35](https://github.com/ruchernchong/blog/commit/649fc35c9283806777ac2a1a4c1d943ecdd2ebf1))
* upsert effortRows on usage ingest ([0ebe372](https://github.com/ruchernchong/blog/commit/0ebe372e0dca0034f63083e4018dd2bb01e8b36c))
* upsert effortRows on usage ingest ([ebf3841](https://github.com/ruchernchong/blog/commit/ebf38411e30cd3c0a32e419b02c5081eb52a6e5c))

### Bug Fixes

* align better-auth to 1.7.x to restore Vercel builds ([1bd3e2c](https://github.com/ruchernchong/blog/commit/1bd3e2c9606d22100c9c85f883faccb0047d271f))
* drop .ts suffixes from usage parser imports ([89f0763](https://github.com/ruchernchong/blog/commit/89f07637c7514ac07d760e6857d4cc8104660795))
* make redis increment atomic with Lua ([48ed0a5](https://github.com/ruchernchong/blog/commit/48ed0a5f27d9452d6d504ce74bb3959464add090))
* register mcp oauth resource for 1.7 provider ([756640d](https://github.com/ruchernchong/blog/commit/756640d4212d6f4467e25d4a8a4d709884f18dc7))

### Performance Improvements

* use neon-http db.batch for usage profile reads ([575ca12](https://github.com/ruchernchong/blog/commit/575ca1231405ba46184e7828a65de4aa2b3dade0))

## [1.36.0](https://github.com/ruchernchong/blog/compare/v1.35.0...v1.36.0) (2026-08-18)

### Features

* virtualise the usage breakdown table ([4b13bc2](https://github.com/ruchernchong/blog/commit/4b13bc23e9d04d31d8607c0bf96246cf8b767a93))

## [1.35.0](https://github.com/ruchernchong/blog/compare/v1.34.0...v1.35.0) (2026-08-12)

### Features

* add Grok 4.6 and xAI provider support ([06e8cd3](https://github.com/ruchernchong/blog/commit/06e8cd3393f9aab60658ad3699fffd77cca7bbf5))

## [1.34.0](https://github.com/ruchernchong/blog/compare/v1.33.2...v1.34.0) (2026-08-10)

### Features

* add day breakdown popover to the usage heatmap ([4f70e2c](https://github.com/ruchernchong/blog/commit/4f70e2cb46808700af0036825462c6f512810ffe))
* open the usage heatmap on the most recent week ([d222143](https://github.com/ruchernchong/blog/commit/d222143582c785ee1324956ef1fa32cfc4928de0))

### Bug Fixes

* keep usage heatmap cells pressable on mobile ([5626bd5](https://github.com/ruchernchong/blog/commit/5626bd54dca30d79d5f9c057b8a27f747516d3da))
* stop breakdown pagination overflowing the page on mobile ([f2bfb5b](https://github.com/ruchernchong/blog/commit/f2bfb5b0369e3bb536a940a8f6b7c5ba56b40ae7))

## [1.33.2](https://github.com/ruchernchong/blog/compare/v1.33.1...v1.33.2) (2026-08-10)

### Performance Improvements

* cache github followers and per-year commit counts ([fb1efcb](https://github.com/ruchernchong/blog/commit/fb1efcba454dfaae236e0a7cd5e382cd8b018767))

## [1.33.1](https://github.com/ruchernchong/blog/compare/v1.33.0...v1.33.1) (2026-08-03)

### Bug Fixes

* use Cursor brand cube for usage provider logo ([db94e2f](https://github.com/ruchernchong/blog/commit/db94e2fca601ac2f568529ae8d3c3b6dd41143a0))

## [1.33.0](https://github.com/ruchernchong/blog/compare/v1.32.0...v1.33.0) (2026-08-03)

### Features

* recognise Cursor as a provider on /usage ([5a78f07](https://github.com/ruchernchong/blog/commit/5a78f0728da2f8458dd88d2bf4d2a07f5e6c0ce7))

## [1.32.0](https://github.com/ruchernchong/blog/compare/v1.31.0...v1.32.0) (2026-08-02)

### Features

* add Free toggle filter to usage breakdown ([945b6da](https://github.com/ruchernchong/blog/commit/945b6da7f6dd1a8d370a68c8198553572b1d155b))

### Bug Fixes

* make the registry sync retry a dead source ([98ecc42](https://github.com/ruchernchong/blog/commit/98ecc420d99c8a9bd876f2c0cef5a3b0ab50fef8)), closes [#353](https://github.com/ruchernchong/blog/issues/353)

## [1.31.0](https://github.com/ruchernchong/blog/compare/v1.30.0...v1.31.0) (2026-07-25)

### Features

* move the model registry sync onto Vercel Workflow ([9ca19d2](https://github.com/ruchernchong/blog/commit/9ca19d28824e8806436019902edceb7baf41abf4)), closes [#347](https://github.com/ruchernchong/blog/issues/347)

### Bug Fixes

* prevent a numeric price dropping a whole source ([e55c1a9](https://github.com/ruchernchong/blog/commit/e55c1a995eca232eaac25ec733443252b949ca5c)), closes [#350](https://github.com/ruchernchong/blog/issues/350)

## [1.30.0](https://github.com/ruchernchong/blog/compare/v1.29.2...v1.30.0) (2026-07-25)

### Features

* replace LiteLLM with AI Gateway and OpenRouter ([5190a7a](https://github.com/ruchernchong/blog/commit/5190a7a431838420ba17aa38eabe135a07232f42)), closes [#342](https://github.com/ruchernchong/blog/issues/342)
* treat Redis failures as cache misses ([08f2dce](https://github.com/ruchernchong/blog/commit/08f2dce5446d28304edcb35ab04ca9918c2f7f6a)), closes [#342](https://github.com/ruchernchong/blog/issues/342)

## [1.29.2](https://github.com/ruchernchong/blog/compare/v1.29.1...v1.29.2) (2026-07-25)

### Bug Fixes

* escape raw NUL separators in the model registry ([847f1ea](https://github.com/ruchernchong/blog/commit/847f1ea3bf72b0f82a4430ac7f3d8d1e46991feb)), closes [#341](https://github.com/ruchernchong/blog/issues/341)

## [1.29.1](https://github.com/ruchernchong/blog/compare/v1.29.0...v1.29.1) (2026-07-24)

### Bug Fixes

* add missing model registry table migration ([25f5fe4](https://github.com/ruchernchong/blog/commit/25f5fe4693f5ec118bccf50ba68a94ef11ac36c8)), closes [#340](https://github.com/ruchernchong/blog/issues/340)
* revalidate display-name cache after usage ingest ([ae1314c](https://github.com/ruchernchong/blog/commit/ae1314c5e3f27f58e7cfab990560db099c8e6d70)), closes [#340](https://github.com/ruchernchong/blog/issues/340)

## [1.29.0](https://github.com/ruchernchong/blog/compare/v1.28.0...v1.29.0) (2026-07-18)

### Features

* use github-api verified release commits ([eea8798](https://github.com/ruchernchong/blog/commit/eea8798a9e204d002aff74370e19316e6ff02b40))

## [1.28.0](https://github.com/ruchernchong/blog/compare/v1.27.0...v1.28.0) (2026-07-18)

### Features

* add dynamic model pricing registry ([33a3136](https://github.com/ruchernchong/blog/commit/33a313606e3f31a3320ec20d6e2c37b0a6bd2e41))
* show lifetime total commits on homepage ([68a9950](https://github.com/ruchernchong/blog/commit/68a995090cc72baec72fec6a1533d11f2e0c8e6b))

### Performance Improvements

* cache GitHub contributions query ([b6248dc](https://github.com/ruchernchong/blog/commit/b6248dcfaa5c87195f5551b9915ec27522ffb364))

## [1.27.0](https://github.com/ruchernchong/blog/compare/v1.26.1...v1.27.0) (2026-07-16)

### Features

* note Anthropic tokens exclude Claude Design ([fd3a253](https://github.com/ruchernchong/blog/commit/fd3a2533c1e3d2240a7ef8efaaec67640f9b000b))

## [1.26.1](https://github.com/ruchernchong/blog/compare/v1.26.0...v1.26.1) (2026-07-16)

### Bug Fixes

* improve blog text contrast (WCAG AA) ([7bf65fe](https://github.com/ruchernchong/blog/commit/7bf65fe45c54b53c8c70ab19f9c2746c4add59df))
* use typography dark modifier for prose ([999ab3f](https://github.com/ruchernchong/blog/commit/999ab3f815a42fe562276c9ccb0ec8cd4158b223))

### Performance Improvements

* cache related posts to speed up post nav ([710bbbe](https://github.com/ruchernchong/blog/commit/710bbbe194fede868e560d2321d25c4f3362ded8))
* prerender blog listing and post pages ([3dff07d](https://github.com/ruchernchong/blog/commit/3dff07db7804ab79a923d5767ba41202c17fd3a0))
* prerender blog post article into static HTML ([3316a45](https://github.com/ruchernchong/blog/commit/3316a45f7d9f2fdf990a75b90edfc0f32bf0a462))

## [1.26.0](https://github.com/ruchernchong/blog/compare/v1.25.2...v1.26.0) (2026-07-16)

### Features

* add shared surface card and page header primitives ([c10764d](https://github.com/ruchernchong/blog/commit/c10764d11b71225002a1485f548dae5a2efa9a9e))
* add theme-aware svg favicon ([fb0540a](https://github.com/ruchernchong/blog/commit/fb0540afb942bac6caf1185c3afe387e519309f0))
* move blog post table of contents to the right ([d27ccea](https://github.com/ruchernchong/blog/commit/d27ccea2cd2c0213e60e5d11a93aca11360abebf))
* redesign homepage from Claude Design mock ([272c63d](https://github.com/ruchernchong/blog/commit/272c63d8a3071ca0a4cb18fa645a89b0cb17cc61))
* restyle blog and post pages to design mocks ([f192c28](https://github.com/ruchernchong/blog/commit/f192c285d7b7c4defb17d869e3f75f87eb18b933))
* restyle projects and about to design mocks ([7acf5f4](https://github.com/ruchernchong/blog/commit/7acf5f4345c3493706a7f77bf711c886daa0a13a))
* restyle usage and dashboard to design mocks ([68d8e1f](https://github.com/ruchernchong/blog/commit/68d8e1fcb692c6475aa68ccb49a9e90c0e15499f))
* update favicon to new logo mark ([5407dd9](https://github.com/ruchernchong/blog/commit/5407dd92f8fa645fde7da482216387fb7ccdc760))

### Bug Fixes

* centre blog post column with balanced toc gutter ([ef1a839](https://github.com/ruchernchong/blog/commit/ef1a83952b2528f5cac8616bed3e6352f2a6a020))
* clarify selected topic pill in blog tag cloud ([c2af1f2](https://github.com/ruchernchong/blog/commit/c2af1f2e655f72744728f93f4968057a999f8bb0))
* rebuild post toc when mdx body streams in ([c1d9f7c](https://github.com/ruchernchong/blog/commit/c1d9f7cf9ed43e190ae9b003285c3cea73240662))
* replace invented copy with real wording on about and projects ([bfe5a5f](https://github.com/ruchernchong/blog/commit/bfe5a5f3e07b4f099d128b6596e757da6eb47c31))
* resolve homepage responsiveness at tablet and mobile ([7179739](https://github.com/ruchernchong/blog/commit/7179739f9d30bc4d507d4915809ed7da5ab4a0aa))
* unblock homepage redesign build ([933575c](https://github.com/ruchernchong/blog/commit/933575cb0fdae62dfe43975ec62f912da2f22433))

## [1.25.2](https://github.com/ruchernchong/blog/compare/v1.25.1...v1.25.2) (2026-07-11)

### Bug Fixes

* render usage last updated label as span element ([1089ec0](https://github.com/ruchernchong/blog/commit/1089ec08b41eb20a5dd1d6d6ac93057ef3388c23))

## [1.25.1](https://github.com/ruchernchong/blog/compare/v1.25.0...v1.25.1) (2026-07-10)

### Bug Fixes

* server-render last updated label ([77f11a1](https://github.com/ruchernchong/blog/commit/77f11a1af2d24a077d496ca69653611bddc604bd))

## [1.25.0](https://github.com/ruchernchong/blog/compare/v1.24.0...v1.25.0) (2026-07-09)

### Features

* upgrade to Next.js 16.3 preview and adopt features ([4baf658](https://github.com/ruchernchong/blog/commit/4baf65802e88d7fc780e0575e177cc54e1580759))

## [1.24.0](https://github.com/ruchernchong/blog/compare/v1.23.0...v1.24.0) (2026-07-08)

### Features

* show usage last-updated time as relative ([487037e](https://github.com/ruchernchong/blog/commit/487037e8b11dd0a819b9eb842b5438f98b5ccd7b))

### Bug Fixes

* render usage last-updated time client-side ([de24273](https://github.com/ruchernchong/blog/commit/de2427340810af7ed7b980485436bfdd53052b39))
* wrap usage last-updated client leaf in Suspense ([8b7e6b0](https://github.com/ruchernchong/blog/commit/8b7e6b0ae1695801df30ad606a37951fcff7a469))

## [1.23.0](https://github.com/ruchernchong/blog/compare/v1.22.1...v1.23.0) (2026-07-01)

### Features

* add pricing override for claude-sonnet-5 ([08d92aa](https://github.com/ruchernchong/blog/commit/08d92aa512fc3e65a0bb9b21d131bbcfea5f2b87))

## [1.22.1](https://github.com/ruchernchong/blog/compare/v1.22.0...v1.22.1) (2026-06-29)

### Bug Fixes

* make token_usage upsert non-decreasing to stop lifetime erosion ([d6d436d](https://github.com/ruchernchong/blog/commit/d6d436d800bc2ca19f8cde353141fabc21fc83be))

## [1.22.0](https://github.com/ruchernchong/blog/compare/v1.21.0...v1.22.0) (2026-06-26)

### Features

* reprice NULL-cost token_usage rows from stored tokens ([5a94f25](https://github.com/ruchernchong/blog/commit/5a94f2504427c00fbce5814cf366212c01230916))

### Bug Fixes

* harden token-usage reprice against pricing outage and races ([9615e42](https://github.com/ruchernchong/blog/commit/9615e42b0caf538fcfed051ddefe08f47e8d2288)), closes [#329](https://github.com/ruchernchong/blog/issues/329)

## [1.21.0](https://github.com/ruchernchong/blog/compare/v1.20.0...v1.21.0) (2026-06-21)

### Features

* add top model to usage ([cc33fea](https://github.com/ruchernchong/blog/commit/cc33feafcf52acf475b778ae828f007654b2de08))

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
