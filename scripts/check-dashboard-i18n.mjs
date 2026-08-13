import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const languages = ['en', 'fr', 'de', 'es', 'it', 'el', 'pl', 'lt'];

const groups = [
  {
    name: 'dashboard overview',
    main: 'src/i18n/dashboardOverview/translations.ts',
    external: { lt: 'src/i18n/dashboardOverview/lt.ts' },
  },
  {
    name: 'add funds',
    main: 'src/i18n/dashboard-add-fund/translations.ts',
    external: {
      lt: 'src/i18n/dashboard-add-fund/lt.ts',
      pl: 'src/i18n/dashboard-add-fund/pl.ts',
    },
  },
  {
    name: 'taxes',
    main: 'src/i18n/dashboard-taxes/translations.ts',
    external: {
      lt: 'src/i18n/dashboard-taxes/lt.ts',
      pl: 'src/i18n/dashboard-taxes/pl.ts',
    },
  },
  {
    name: 'wallet QR',
    main: 'src/i18n/qr-code/translations.ts',
    external: { lt: 'src/i18n/qr-code/lt.ts' },
  },
];

function parse(file) {
  const absolute = path.join(root, file);
  return ts.createSourceFile(
    absolute,
    fs.readFileSync(absolute, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function propertyName(node) {
  if (!node?.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)) return node.name.text;
  return null;
}

function objectKeys(object, context) {
  const keys = new Set();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property);
    if (!key) continue;
    if (keys.has(key)) throw new Error(`${context}: duplicate key ${key}`);
    keys.add(key);
  }
  return keys;
}

function registeredLanguageObjects(file) {
  const source = parse(file);
  let registration = null;

  function visit(node) {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'registerTranslations'
      && node.arguments[0]
      && ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      registration = node.arguments[0];
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!registration) throw new Error(`${file}: registerTranslations({...}) was not found`);

  const result = new Map();
  for (const property of registration.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const language = propertyName(property);
    if (language && ts.isObjectLiteralExpression(property.initializer)) {
      result.set(language, objectKeys(property.initializer, `${file}:${language}`));
    }
  }
  return result;
}

function exportedObjectKeys(file, variableName) {
  const source = parse(file);
  let object = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === variableName
      && node.initializer
      && ts.isObjectLiteralExpression(node.initializer)
    ) {
      object = node.initializer;
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!object) throw new Error(`${file}: exported ${variableName} object was not found`);
  return objectKeys(object, `${file}:${variableName}`);
}

let failed = false;

for (const group of groups) {
  const dictionaries = registeredLanguageObjects(group.main);
  for (const [language, file] of Object.entries(group.external)) {
    dictionaries.set(language, exportedObjectKeys(file, language));
  }

  const english = dictionaries.get('en');
  if (!english) throw new Error(`${group.main}: English dictionary was not found`);

  for (const language of languages) {
    const dictionary = dictionaries.get(language);
    if (!dictionary) {
      console.error(`${group.name}: ${language} dictionary is missing`);
      failed = true;
      continue;
    }

    const missing = [...english].filter((key) => !dictionary.has(key));
    const extra = [...dictionary].filter((key) => !english.has(key));
    if (missing.length || extra.length) {
      console.error(`${group.name}: ${language} does not match English`);
      if (missing.length) console.error(`  missing: ${missing.join(', ')}`);
      if (extra.length) console.error(`  extra: ${extra.join(', ')}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`Translation parity passed for ${groups.length} recently changed areas across ${languages.length} languages.`);
