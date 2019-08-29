# npm package support TypeScript

UserScript that detects TypeScript support of npm package.

Inspired by [npm: package support types](https://gist.github.com/azu/ec22f3def09563ece54f8dc32523b152)

## Install

Install from [npm-package-support-ts.user.js](https://8th713.github.io/npm-package-support/npm-package-support-ts.user.js)

**Dependencies:**

You need to install Greasemonkey extension before installing this script.

- [Greasemonkey – Firefox](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/)
- [Tampermonkey - Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=ja)

## Usage

Visit any npm package page.

**Example:**

* [React](https://www.npmjs.com/package/react) - In DefinitelyTyped.
* [Redux](https://www.npmjs.com/package/redux) - Included in the package.
* [@testing-library/react](https://www.npmjs.com/package/@testing-library/react) - Depends on external.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Development
```sh
# Setup
npm install
# or
yarn install

# Build
npm run build
# or
yarn build

# Watch
npm run build -- -w
# or
yarn build -w
```

## License

[MIT license](./LICENSE)
