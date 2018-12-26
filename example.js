const { compareFiles, createDirectory, updateFiles } = require('./index');
const basePath = './files';
const filesDirs = ['en', 'nl'];

const config = {
  basePath: basePath,
  compareWith: filesDirs,
  defaultDir: 'en',
  key_placeholder: 'missing_key_value'
};


// compareFiles(config).then(response => {
//   console.log(response);
// });


// updateFiles(config).then(response => {
//     console.log(response);
//   });


  // Create a directory by given name and copy all files
  createDirectory(config)('demo12');