/*!
// ==UserScript==
// @name        npm package support TypeScript
// @description Detects TypeScript support of npm package.
// @version     1.2.0
// @author      8th713
// @license     MIT
// @namespace   http://github.com/8th713
// @match       https://www.npmjs.com/package/*
// @grant       GM_xmlhttpRequest
// @connect     registry.npmjs.com
// ==/UserScript==

Inspired by npm: package support types
https://gist.github.com/azu/ec22f3def09563ece54f8dc32523b152
*/
const getPackageName = (pathname) => {
    const [name, version] = pathname.split('/v/');
    const fullName = name
        .split('/')
        .slice(2)
        .join('/');
    return [fullName, version];
};
const isDTPackage = (fullName) => fullName.startsWith('@types/');
const fetchPackage = (packageName) => new Promise((resolve, reject) => {
    const path = packageName.replace(/\//g, '%2F');
    GM_xmlhttpRequest({
        method: 'GET',
        url: `https://registry.npmjs.com/${path}`,
        onload(response) {
            try {
                resolve(JSON.parse(response.responseText));
            }
            catch (error) {
                reject(error);
            }
        },
        onerror(response) {
            reject(new Error(response.responseText));
        }
    });
});
const isPackage = (metadata) => Object.hasOwnProperty.call(metadata, 'dist-tags');
const getPackage = (pkg, version = pkg['dist-tags'].latest) => pkg.versions[version];
const hasTypeField = (pkg) => !!(pkg.types || pkg.typings);
const createTypePackageName = (pkgName) => {
    if (pkgName.includes('@', 0)) {
        return `@types/${pkgName.slice(1).replace('/', '__')}`;
    }
    return `@types/${pkgName}`;
};
const createLink = (text, href) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    return link;
};
const insertToTop = (...nodes) => {
    const top = document.querySelector('#top');
    if (!top) {
        throw new Error('Not found #top');
    }
    const p = document.createElement('p');
    const span = document.createElement('span');
    p.id = 'npm-package-support';
    span.setAttribute('style', 'color:green');
    span.textContent = 'TYPE: ';
    p.append(span);
    p.append(...nodes);
    top.firstElementChild.insertAdjacentElement('beforebegin', p);
};
const hasDependency = (pkg, pkgName) => !!(pkg.dependencies && pkg.dependencies[pkgName]);
const main = async () => {
    try {
        const [pkgName, version] = getPackageName(location.pathname);
        if (!pkgName)
            throw new Error('Not found package name');
        if (isDTPackage(pkgName))
            throw new Error('Package is type definitions');
        const pkgs = await fetchPackage(pkgName);
        if (!isPackage(pkgs))
            throw new Error('Failed to get package');
        const pkg = getPackage(pkgs, version);
        if (hasTypeField(pkg))
            return insertToTop('Package contains type definitions');
        const typeName = createTypePackageName(pkgName);
        if (hasDependency(pkg, typeName))
            return insertToTop(`Package depends on`, createLink(typeName, `/package/${typeName}`));
        const typesPkgs = await fetchPackage(typeName);
        if (!isPackage(typesPkgs))
            throw new Error('Does not support types');
        const typesPkg = getPackage(typesPkgs);
        return insertToTop(createLink(typesPkg._id, `/package/${typeName}`));
    }
    catch (error) {
        insertToTop(error.message);
    }
};
main();
window.addEventListener('popstate', () => {
    const p = document.getElementById('npm-package-support');
    if (p)
        p.remove();
    main();
});
