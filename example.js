const deepCompare = require('./index')
const localesBasePath = './locales';
const localesDirs = ['en', 'nl'];


deepCompare.directory({
  basePath : localesBasePath,
  compareWith : localesDirs
}).then(response=>{
  console.log(response);
});