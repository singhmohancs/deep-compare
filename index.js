const deepKeys = require('./deepCompare');
const fs = require('fs');
const chalk = require('chalk');
const { isEmpty, set, cloneDeep, difference, endsWith, toLower, findIndex, isObject, get } = require('lodash');
const { getValidKey } = require('./util');

/**
  * default properties
  * @private
  */
const defaultOptions = {
  basePath: '', //required
  defaultDir: '', //optional
  compareWith: [],
  createUpdate: false,
  key_placeholder: 'missing_key',
  debugLog: false
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
    this.debugLog = options.debugLog;
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
        this.debugLog && process.stdout.write(chalk.red(`directory not found ${this.comparator}`) + '\n\n');
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
            const newLocaleFile = cloneDeep(f2_content);
            this.createFile(compareWith, file, newLocaleFile, compareLogs);
          }

          logs.push({
            file: file,
            missing_keys: missingKeys
          });

        }
      } catch (e) {
        let errorMsg = e.toString();
        const isFile_404 = errorMsg && errorMsg.indexOf('no such file or directory') >= 0;
        errorMsg = `${isFile_404 ? 'Not found' : 'Parsing Error'} ${compareWith}/${file}: ${errorMsg}`;

        logs.push({
          file: file,
          missing_keys: errorMsg
        });

        if (this.createUpdate && isFile_404) {
          const newLocaleFile = cloneDeep(f1_content);
          this.createFile(compareWith, file, newLocaleFile, f1_keys);
        }
        if (this.debugLog && !isEmpty(errorMsg)) {
          process.stdout.write(chalk.red(`${errorMsg}`) + '\n');
        }
      }
    });
    return logs;
  }
  /**
   * @name createFile
   * @description copy a file and update value of each key to this.options.key_placeholder. Default: missing_key
   * 
   * @returns void
   */
  createFile(dir, fileName, fileContent = null, keysToUpdate = []) {
    let jsObject, keys;
    if (fileContent && keysToUpdate.length > 0) {
      jsObject = fileContent;
      keys = keysToUpdate;
    } else {
      const file = fs.readFileSync(`${this.basePath}/${this.comparator}/${fileName}`, 'utf8');
      jsObject = JSON.parse(file);
      keys = deepKeys(jsObject, true);
    }
    const jsObject_a = cloneDeep(jsObject);
    keys.forEach(key => {
      const _key = key.indexOf('\\.') >= 0 ? getValidKey(key) : key;
      const placeHolder = isObject(get(jsObject, _key)) ? {} : this.key_placeholder;
      set(jsObject_a, _key, placeHolder);
    });
    //convert JSON Object to string
    const newFile = JSON.stringify(jsObject_a, null, 2);
    //write json file
    fs.writeFile(`${this.basePath}/${dir}/${fileName}`, newFile, 'utf8', (err) => {
      if (err) {
        this.debugLog && err && process.stdout.write(`${chalk.red('Parsing Errors')} ${err.toString()} ---- ${compareWith} - ${fileName} \n`)
      }
    });
  }
  /**
   * @name createDirectory
   * @description create a directory with given name and copy files from default directory
   * @param {string} directory A name of directory that to be created.
   * 
   * @returns void
   */
  createDirectory(name) {
    const _directory = `${this.basePath}/${name}`;
    if (!fs.existsSync(_directory)) {
      fs.mkdirSync(_directory);
    }
    try {
      //copy/create files if comparator/default directory is given
      if (this.comparator) {
        let defaultDirFiles = fs.readdirSync(`${this.basePath}/${this.comparator}`);
        defaultDirFiles = defaultDirFiles.filter(file => {
          return endsWith(toLower(file), '.json');
        });
        defaultDirFiles.forEach(file => {
          this.createFile(name, file);
        });
      }

    } catch (err) {
      this.debugLog && process.stdout.write(chalk.red(`directory not found ${this.comparator}`) + '\n\n');
    }
  }

  //end of class
}

module.exports = {
  compareFiles: (options) => {
    Object.assign(options, {
      createUpdate: false
    });
    const ins = new CompareDirectory(options);
    return ins.fileComparator();
  },
  updateFiles: (options) => {
    Object.assign(options, {
      createUpdate: true
    });
    const ins = new CompareDirectory(options);
    // true flag enables UPDATE/CREATE missing Keys in json files
    return ins.fileComparator();
  },
  createDirectory: (options) => {
    Object.assign(options, {
      createUpdate: false
    });
    const ins = new CompareDirectory(options);
    // true flag enables UPDATE/CREATE missing Keys in json files
    return (name) => {
      return ins.createDirectory(name);
    };
  }
};