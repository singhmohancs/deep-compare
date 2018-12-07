const deepKeys = require('deep-keys');
const { isEmpty, set, cloneDeep, difference, endsWith, toLower } = require('lodash');
const fs = require('fs');
const chalk = require('chalk');
const localesBasePath = './locales/i18n';

module.exports = fileComparison = function (callback) {
  const compareLogs = {};
  // en is the default locale that will be compared with other locales
  const compareWith = ['es'];//['nl','es', 'pt', 'vi', 'zh'];
  const defaultLocaleFiles = fs.readdirSync(localesBasePath + '/en');
  compareWith.forEach((ln, idx) => {
    process.stdout.write('\n\n' + chalk.blue('************* Language - ' + ln + ' *****************') + '\n\n');
    const logs = compareLocales(ln, defaultLocaleFiles);
    Object.assign(compareLogs, {
      [ln]: logs
    });
  });
  if (Object.keys(compareLogs).length > 0) {
    return 'Found missing files/keys in locale';
  } else {
    return;
  }
}

const compareLocales = (compareWith, defaultLocaleFiles) => {
  const logs = [];
  defaultLocaleFiles.forEach(file => {
    const f1 = fs.readFileSync(localesBasePath + '/en/' + file, 'utf8');
    const f1_content = JSON.parse(f1);
    const f1_keys = deepKeys(f1_content, true);
    try {
      const f2 = fs.readFileSync(localesBasePath + '/' + compareWith + '/' + file, 'utf8');
      const f2_content = JSON.parse(f2);
      const f2_keys = deepKeys(f2_content, true);

      const compareLogs = difference(
        f1_keys,
        f2_keys
      );

      if (compareLogs.length === 0) {
        let l = file + ' [Passed]';
        process.stdout.write(chalk.green(l) + '\n');
      } else {
        let msg = file + ' [Failed] (missing Keys) -> ';
        let missingKeys = compareLogs.toString();
        let l = chalk.red(msg) + missingKeys.toString() + '\n';
        /**
         * run iterator on missing keys and add missing key in new file 
         */
        compareLogs.forEach(key => {
          set(f2_content, key, 'missing_key');
        });
        //convert JSON Object to string
        const updatedLocale = JSON.stringify(f2_content, null, 2);
        //write json file
        fs.writeFile(`${localesBasePath}/${compareWith}/${file}`, updatedLocale, { flag: "w" },
          (err) => {
            !err ? process.stdout.write(`${chalk.red('Parsing Errors')} ---- ${compareWith} - ${file} \n`) : '';
          });
        logs.push({
          file: file,
          missing_keys: missingKeys
        });
      }
    } catch (e) {

      let msg = file + '  [Failed] (file not found) -> ';
      let errorMsg = e.toString();
      let l = chalk.red(msg) + errorMsg + '\n';
      process.stdout.write(l);
      logs.push({
        file: errorMsg,
        missing_keys: errorMsg
      });

      const newLocaleFile = cloneDeep(f1_content);
      f1_keys.forEach((key) => {
        set(newLocaleFile, key, 'missing_key');
      })

      if (!isEmpty(newLocaleFile)) {
        fs.writeFile(`${localesBasePath}/${compareWith}/${file}`, JSON.stringify(newLocaleFile, null, 2), { flag: "w" },
          (err) => {
            process.stdout.write(chalk.green(err) + '\n');
          });
      }
    }
  });
  return logs;
};


fileComparison();
