const { execSync } = require('child_process');
const { join } = require('path');
const { existsSync, mkdirSync, chmodSync } = require('fs');

const tscListDir = join(__dirname, 'tsc-list/');

class TscInstaller {
  constructor() {
    this._supportedVersions = [];
  }

  init(supportedVersions) {
    this._supportedVersions = supportedVersions || [];

    console.log('Installing different versions of TSC ...');

    for (const tscVersion of this._supportedVersions) {
      console.log('Installing TSC ' + tscVersion);
      this._install(tscVersion);
    }
  }

  supportedCompilers() {
    return this._supportedVersions.map(version => ({
      version: version,
      path: this._compilerPath(version),
    }));
  }

  _compilerPath(version) {
    return join(tscListDir, version + '/node_modules/typescript/bin/tsc');
  }

  _install(version) {
    if (!existsSync(tscListDir)) {
      mkdirSync(tscListDir);
    }

    const tscInstallationDir = join(tscListDir, version);
    if (!existsSync(tscInstallationDir)) {
      mkdirSync(tscInstallationDir);
      execSync('npm init -y', { cwd: tscInstallationDir });
    }

    execSync('npm i typescript@' + version + ' --no-save --silent', { cwd: tscInstallationDir });
  }
}

module.exports.tscInstaller = new TscInstaller();
