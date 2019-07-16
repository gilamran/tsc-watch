const fs = require('fs');
const findUp = require('find-up');
const execSync = require('child_process').execSync;
const packageJsonPath = findUp.sync('package.json');

const run = (command, options) => execSync(command, { encoding: 'utf8', ...options });

const getHashFor = branchName => run(`git rev-parse --verify ${branchName}`).trim();

function ensurePackageJsonHasNoChanges() {
  if (run(`git status -s ${packageJsonPath}`).length) {
    console.error('First, commit your package.json');
    process.exit(1);
  }
}

function ensureNothingStaged() {
  if (run(`git diff --name-only --cached`).length) {
    console.error('You need to push your staged changes first');
    process.exit(1);
  }
}

function bumpVersion(version, upgradeType) {
  let [major, minor, patch] = version.split('.').map(x => parseInt(x, 10));

  switch (upgradeType) {
    case 'major':
      return `${major + 1}.${minor}.${patch}`;

    case 'minor':
      return `${major}.${minor + 1}.${patch}`;

    case 'patch':
      return `${major}.${minor}.${patch + 1}`;

    default:
      return `${major}.${minor}.${patch}`;
  }
}

function upgradePackageJson() {
  const packageJson = require(packageJsonPath);
  const { version } = packageJson;
  const newVersion = bumpVersion(version, 'patch');
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Version bumped from ${version} to ${packageJson.version}`);
  return newVersion;
}

function commitPackageJson(newVersion) {
  run(`git add ${packageJsonPath}`);
  run(`git commit ${packageJsonPath} -m "Version v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Version v${newVersion}"`);
  run(`git push origin master --tags`);
}

ensureNothingStaged();
ensurePackageJsonHasNoChanges();
const newVersion = upgradePackageJson();
commitPackageJson(newVersion);
