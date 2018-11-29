const deepKeys = require('deep-keys');
const fs = require('fs');
const { isEmpty, set, cloneDeep, difference, endsWith, toLower } = require('lodash');
const defaultOptions = {
  basePath: '', //required
  defaultDir: '', //optional
  compareWith: [],
  createUpdate: false
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
  const { basePath, defaultDir, compareWith, createUpdate } = options;
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
      const logs = compareFile({
        compareWith: file,
        defaultDirFiles: defaultDirFiles,
        localesBasePath: basePath,
        comparator,
        createUpdate: createUpdate
      });
      Object.assign(compareLogs, {
        [file]: logs
      });
    });
    resolve(compareLogs);
  });
}

function compareFile(options) {
  const { compareWith, defaultDirFiles, localesBasePath, comparator, createUpdate } = options;
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

      if (compareLogs.length > 0) {
        logs.push({
          file: file,
          missing_keys: missingKeys
        });
        /**
         * create file if not found
         * add new key if not found
         */
        if (createUpdate) {
          /**
           * run iterator on missing keys and add missing key in new file 
          */
          compareLogs.forEach(key => {
            set(f2_content, key, 'missing_key');
          });
          //convert JSON Object to string
          const updatedLocale = JSON.stringify(f2_content, null, 2);
          //write json file
          fs.writeFile(`${localesBasePath}/${compareWith}/${file}`, updatedLocale, { flag: "w" });
        }
      }
    } catch (e) {
      let errorMsg = e.toString();
      logs.push({
        file: errorMsg,
        missing_keys: errorMsg
      });

      if (createUpdate) {
        const newLocaleFile = cloneDeep(f1_content);
        f1_keys.forEach((key) => {
          set(newLocaleFile, key, 'missing_key');
        })
        !isEmpty(newLocaleFile) && fs.writeFileSync(`${localesBasePath}/${compareWith}/${file}`, JSON.stringify(newLocaleFile, null, 2));
      }

    }
  });
  return logs;
}



module.exports = {
  directory: compareDirectory
};