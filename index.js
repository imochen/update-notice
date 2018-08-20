const { execSync } = require('child_process');
const semver = require('semver');
const boxen = require('boxen');
const chalk = require('chalk');

const { name } = require('./package.json');

const runExec = (cmd) => {
  return execSync(cmd, {
    encoding: 'utf8',
  }).trim();
}

const hasNPM = () => {
  const version = runExec('npm -v');
  return semver.valid(version);
}

class UpdateNotice {
  constructor({ pkg = {}, options = {} }) {
    this.options = options;
    this.pkg = pkg;

    if (!this.pkg.name || !this.pkg.version) {
      throw new Error('pkg.name and pkg.version required');
      return;
    }

    if (!hasNPM()) { // need use npm get remote package info.
      throw new Error(`${name} need install npm first!`);
      return;
    }
  }

  getRemoteVersion({ name, registry, tag = 'latest' }) {
    return runExec(`npm view ${name}@${tag} version` + (registry ? ` --registry=${registry}` : ''));
  }

  notify(callback) {
    const latestVersion = this.getRemoteVersion({ name: this.pkg.name, registry: this.options.registry });
    if (!semver.lt(this.pkg.version, latestVersion)) return;
    let cmd = this.options.isSudo ? 'sudo ' : '';
    cmd += 'npm i ';
    cmd += this.options.isGlobal ? '-g ' : '';
    cmd += this.pkg.name + ' ';
    cmd += this.options.registry ? `--registry=${this.options.registry} ` : '';


    let msg = `Update available ${chalk.dim(this.pkg.version)}${chalk.reset(' → ')}${chalk.green(latestVersion)}\n\n`;
    msg += 'Run ';
    msg += chalk.cyan(cmd);
    msg += 'to update';
    msg += callback ? `\n\n${callback(chalk)}` : '';

    console.log(boxen(msg, {
      padding: 1,
      margin: 1,
      align: 'center',
      borderColor: 'yellow',
      borderStyle: 'round',
    }));

  }
}

module.exports = ({ pkg, options }) => {
  return new UpdateNotice({ pkg, options });
}
