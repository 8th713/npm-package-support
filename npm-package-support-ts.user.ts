/*!
// ==UserScript==
// @name        npm package support TypeScript
// @description Detects TypeScript support of npm package.
// @version     1.3.0
// @author      8th713
// @license     MIT
// @homepage    https://github.com/8th713/npm-package-support
// @namespace   http://github.com/8th713
// @match       https://www.npmjs.com/package/*
// @grant       GM_xmlhttpRequest
// @connect     registry.npmjs.com
// ==/UserScript==

Inspired by npm: package support types
https://gist.github.com/azu/ec22f3def09563ece54f8dc32523b152
*/

/** https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#version */
interface Package {
  /** <name>@<version> */
  _id: string
  name: string
  version: string
  types?: string
  typings?: string
  dependencies?: { [key: string]: string }
}

/** https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#package */
interface Packument {
  name: string
  'dist-tags': { [tag: string]: string }
  versions: { [version: string]: Package }
}

/**
 * - /package/foo -> ['foo']
 * - /package/@scope/foo -> ['@scope/foo']
 * - /package/foo/v/1.0.0 -> ['foo','1.0.0']
 * - /package/@scope/foo/v/1.0.0 -> ['@scope/foo','1.0.0']
 */
const getPackageName = (pathname: string) => {
  const [path, version] = pathname.split('/v/')
  const name = path
    .split('/')
    .slice(2)
    .join('/')

  return [name, version]
}

const isDTPackage = (name: string) => name.startsWith('@types/')

const escapeSlash = (str: string) => str.replace(/\//g, '%2F')

/**
 * - foo -> @types/foo
 * - @scope/foo -> @types/scope__foo
 */
const createTypePackageName = (pkgName: string) => {
  if (pkgName.startsWith('@')) {
    return `@types/${pkgName.slice(1).replace('/', '__')}`
  }
  return `@types/${pkgName}`
}

const isPackument = (metadata: unknown): metadata is Packument =>
  Object.hasOwnProperty.call(metadata, 'dist-tags')

/** Gets the specified `Package` of `Packument`. */
const getPackage = (
  pkg: Packument,
  version: string = pkg['dist-tags'].latest
) => pkg.versions[version]

/** Checks if the `types` field or `typings` field exists in the `Package`. */
const hasTypeField = (pkg: Package) => !!(pkg.types || pkg.typings)

/** Checks if the specified package exists in the `Package`'s dependency. */
const hasDependency = (pkg: Package, pkgName: string) =>
  !!(pkg.dependencies && pkg.dependencies[pkgName])

const CACHE: { [key: string]: Packument } = {}

const fetchPackument = (packageName: string) =>
  new Promise<Packument>((resolve, reject) => {
    if (CACHE[packageName]) {
      return resolve(CACHE[packageName])
    }
    const path = escapeSlash(packageName)
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://registry.npmjs.com/${path}`,
      onload(response) {
        try {
          const json = JSON.parse(response.responseText)
          if (isPackument(json)) {
            CACHE[packageName] = json
            resolve(json)
          } else {
            reject(json)
          }
        } catch (error) {
          reject(error)
        }
      },
      onerror(response) {
        reject(new Error(response.responseText))
      }
    })
  })

const ID = 'npm-package-support'

const createLink = (text: string, href: string) => {
  const link = document.createElement('a')
  link.href = href
  link.textContent = text
  return link
}

const insertToTop = (...nodes: (string | Node)[]) => {
  const top = document.querySelector('#top')
  if (!top) {
    throw new Error('Not found #top')
  }
  const p = document.createElement('p')
  const span = document.createElement('span')
  p.id = ID
  span.setAttribute('style', 'color:green')
  span.textContent = 'TYPE: '
  p.append(span)
  p.append(...nodes)
  top.firstElementChild!.insertAdjacentElement('beforebegin', p)
}

const cleanup = () => {
  const p = document.getElementById(ID)
  if (p) p.remove()
}

const patchHistoryEvents = () => {
  const events = ['pushState', 'replaceState'] as const

  events.forEach(type => {
    const original = history[type]
    history[type] = (...args) => {
      original.apply(history, args)
      dispatchEvent(new Event(type))
    }
  })
}

const main = async () => {
  cleanup()
  try {
    const [name, version] = getPackageName(location.pathname)
    if (!name) throw new Error('Not found package name')
    if (isDTPackage(name)) throw new Error('Package is type definitions')

    const packument = await fetchPackument(name).catch(() =>
      Promise.reject(new Error('Failed to get package'))
    )
    const pkg = getPackage(packument, version)
    if (hasTypeField(pkg))
      return insertToTop('Package contains type definitions')

    const typeName = createTypePackageName(name)
    if (hasDependency(pkg, typeName))
      return insertToTop(
        `Package depends on`,
        createLink(typeName, `/package/${typeName}`)
      )

    const typesPackument = await fetchPackument(typeName).catch(() =>
      Promise.reject(new Error('Does not support types'))
    )
    const typesPkg = getPackage(typesPackument)
    return insertToTop(createLink(typesPkg._id, `/package/${typeName}`))
  } catch (error) {
    insertToTop(error.message)
  }
}

patchHistoryEvents()

const events = ['pushState', 'replaceState']

events.forEach(eventName => addEventListener(eventName, main))
main()
