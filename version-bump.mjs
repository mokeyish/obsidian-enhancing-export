import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import process from 'process';


const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const version = process.argv.at(2) ?? pkg.version;

if (version != pkg.version) {
  pkg.version = version;
  writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  exec('git add package.json');
}


// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = pkg.version;
manifest.description = pkg.description;
writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[pkg.version] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));

exec('git add manifest.json versions.json');
