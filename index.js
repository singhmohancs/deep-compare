const deepKeys = require('deep-keys');
const fs = require('fs');
const chalk = require('chalk');
const { isEmpty, set, cloneDeep, difference, endsWith, toLower, findIndex } = require('lodash');

/**
  * default properties
  * @private
  */
const defaultOptions = {
  basePath: '', //required
  defaultDir: '', //optional
  compareWith: [],
  createUpdate: false,
  key_placeholder: 'missing_key'
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
class CompareDirectory {
  /**
   * CompareDirectory constructor
   * @param {*} options 
   */
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    /**
     * set default properties
     */
    this.basePath = options.basePath;
    this.defaultDir = options.defaultDir;
    this.compareWith = options.compareWith;
    this.createUpdate = options.createUpdate;
    this.key_placeholder = options.key_placeholder;
    /**
     * set defaultDir else first element is considered as compareWith
     * and remove first element
     */
    this.setComparator();
  }

  /**
   * @name setComparator
   * @description An helper function that set default comparator
   * 
   * @returns void
   */
  setComparator() {
    this.comparator = this.defaultDir || this.compareWith[0];
    if (this.comparator) {
      const idx = findIndex(this.compareWith, (f) => {
        return toLower(f) == toLower(this.comparator);
      });
      idx >= 0 && this.compareWith.splice(idx, 1);
    }
  }
  /**
   * @name fileComparator
   * @description read files from defaultDir and compare with each file from compareWith
   * @returns promise
   */
  fileComparator() {
    const compareLogs = {};
    let defaultDirFiles;
    // Return new promise 
    return new Promise((resolve) => {
      try {
        defaultDirFiles = fs.readdirSync(`${this.basePath}/${this.comparator}`);
        defaultDirFiles = defaultDirFiles.filter(file => {
          return endsWith(toLower(file), '.json');
        });
      } catch (err) {
        process.stdout.write(chalk.red(`directory not found ${this.comparator}`) + '\n\n');
        return;
      }
      this.compareWith.forEach((file) => {
        const logs = this.compareFile(defaultDirFiles, file);
        Object.assign(compareLogs, {
          [file]: logs
        });
      });
      resolve(compareLogs);
    });
  }
  /**
    * @name compareFile
    * @description An helper function that compares file content and update
    * @param defaultDirFiles A list of files that to be compared
    * 
    * @returns Array A list of logs
    */
  compareFile(defaultDirFiles, compareWith) {
    const logs = [];
    defaultDirFiles.forEach(file => {
      const f1 = fs.readFileSync(`${this.basePath}/${this.comparator}/${file}`, 'utf8');
      const f1_content = JSON.parse(f1);
      const f1_keys = deepKeys(f1_content, true);
      try {
        const f2 = fs.readFileSync(`${this.basePath}/${compareWith}/${file}`, 'utf8');
        const f2_content = JSON.parse(f2);
        const f2_keys = deepKeys(f2_content, true);
        const compareLogs = difference(
          f1_keys,
          f2_keys
        );

        if (compareLogs.length > 0) {
          let missingKeys = compareLogs.toString();

          /**
           * create file if not found
           * add new key if not found
           */
          if (this.createUpdate) {
            /**
             * run iterator on missing keys and add missing key in new file 
            */
            compareLogs.forEach(key => {
              set(f2_content, key, this.key_placeholder);
            });
            //convert JSON Object to string
            const updatedLocale = JSON.stringify(f2_content, null, 2);
            //write json file
            fs.writeFile(`${this.basePath}/${compareWith}/${file}`, updatedLocale, 'utf8', function (err) {
              if (err) {
               err &&  process.stdout.write(`${chalk.red('Parsing Errors')} ${err.toString()} ---- ${compareWith} - ${file} \n`)
              }
            });
          }
          
          logs.push({
            file: file,
            missing_keys: missingKeys
          });

        }
      } catch (e) {
        let errorMsg = e.toString();
        logs.push({
          file: file,
          missing_keys: `Parsing Error: ${errorMsg}`
        });

        if (this.createUpdate) {
          const newLocaleFile = cloneDeep(f1_content);
          f1_keys.forEach((key) => {
            set(newLocaleFile, key, this.key_placeholder);
          })
          if (!isEmpty(newLocaleFile)) {
            fs.writeFile(`${this.basePath}/${compareWith}/${file}`, JSON.stringify(newLocaleFile, null, 2), 'utf8',
              (err) => {
                err && process.stdout.write(chalk.red(err.toString()) +`-- ${this.basePath}/${compareWith}/${file} ---`+ '\n');
              });
          }
        }
      }
    });
    return logs;
  }

  //end of class
}


/**
 * exports module
 */
module.exports = {
  directory: (options) => {
    const compareDir = new CompareDirectory(options);
    return compareDir.fileComparator();
  }
};