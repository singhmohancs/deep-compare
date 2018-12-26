const deepCompare = require('./index');
const basePath = './files';
const filesDirs = ['en', 'nl'];


const _compare = new deepCompare({
  basePath: basePath,
  compareWith: filesDirs,
  createUpdate: true,
  defaultDir: 'en',
  key_placeholder: 'missing_key_value'
});


_compare
  .fileComparator()
  .then(response => {
    console.log(response);
  });


  // Create a directory by given name and copy all files
  // _compare.createDirectory('demo');