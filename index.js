const deepKeys = require('deep-keys');
const fs = require('fs');
const chalk = require('chalk');
const { isEmpty, set, cloneDeep, difference, endsWith, toLower } = require('lodash');
const defaultOptions = {
  basePath: '', //required
  defaultDir: '', //optional
  compareWith: []
};


/**
 * @name compareDirectory
 * @description compare json files inside directory
 * @param {object} options
 *  { 
      basePath : '', //required
      defaultDir : '', //optional
      compareWith : []
  } 
 */
function compareDirectory(options) {
  options = Object.assign({}, defaultOptions, options);
  const compareLogs = {};
  const { basePath, defaultDir, compareWith } = options;
  const comparator = defaultDir || compareWith[0];
  let defaultDirFiles

  !defaultDir && compareWith.splice(0, 1);
  
  // Return new promise 
  return new Promise(function (resolve) {
    try {
      defaultDirFiles = fs.readdirSync(`${basePath}/${comparator}`);
      defaultDirFiles = defaultDirFiles.filter(file => {
        return endsWith(toLower(file), '.json');
      });
    } catch (err) {
      process.stdout.write(chalk.red(`directory not found ${comparator}`) + '\n\n');
      return;
    }

    compareWith.forEach((file, idx) => {
      process.stdout.write('\n\n' + chalk.blue('************* File - ' + file + ' *****************') + '\n\n');
      const logs = compareFile({
        compareWith: file,
        defaultDirFiles: defaultDirFiles,
        localesBasePath: basePath,
        comparator
      });
      Object.assign(compareLogs, {
        [file]: logs
      });
    });
    resolve(compareLogs);
  });
}

function compareFile(options) {
  const { compareWith, defaultDirFiles, localesBasePath, comparator } = options;
  const logs = [];
  defaultDirFiles.forEach(file => {
    const f1 = fs.readFileSync(`${localesBasePath}/${comparator}/${file}`, 'utf8');
    const f1_content = JSON.parse(f1);
    const f1_keys = deepKeys(f1_content, true);
    try {
      const f2 = fs.readFileSync(`${localesBasePath}/${compareWith}/${file}`, 'utf8');
      const f2_content = JSON.parse(f2);
      const f2_keys = deepKeys(f2_content, true);
      const compareLogs = difference(
        f1_keys,
        f2_keys
      );

      if (compareLogs.length === 0) {
        let l = file + ' [Found]';
        process.stdout.write(chalk.green(l) + '\n');
      } else {
        let msg = file + ' [Not found] (missing Keys) -> ';
        let missingKeys = compareLogs.toString();
        let l = chalk.red(msg) + missingKeys.toString() + '\n';
        logs.push({
          file: file,
          missing_keys: missingKeys
        });
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
          (sucess) => {
            console.log('message', sucess);
            !sucess ? process.stdout.write(`${chalk.red('Parsing Errors')} ---- ${compareWith} - ${file} \n`) : JSON.stringify(sucess);
          });

      }
    } catch (e) {
      let msg = file + '  [Not found] (file not found) -> ';
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
          (error) => {
            !error ? process.stdout.write(`${chalk.green('New file is created')} ---- /${compareWith} - ${file} \n`) : JSON.stringify(error);
          });
      }
    }
  });
  return logs;
}



module.exports = {
  directory: compareDirectory
};