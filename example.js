const deepCompare = require('./index')
const basePath = './files';
const filesDirs = ['en', 'nl'];


deepCompare.directory({
  basePath: basePath,
  compareWith: filesDirs,
  createUpdate: false,
  defaultDir: 'en',
  key_placeholder: 'demo_key'
}).then(response => {
  console.log(response);
});