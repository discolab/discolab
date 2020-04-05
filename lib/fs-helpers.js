const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { allSettled, isResolved } = require('./promise-helpers');
const { log } = require('./logger');

module.exports = {
  copy,
  readFile,
  readJsonFile,
  writeFile,
  pathExists,
  findFiles,
  findJsons
};

function readFile(filePath, encoding = 'utf8') {
  return new Promise((resolve, reject) => {
    log('reading file', filePath);
    fs.readFile(filePath, encoding, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function readJsonFile(filePath) {
  return readFile(filePath)
    .then(data => JSON.parse(data))
    .catch((e) => log(`error reading JSON file ${filePath}:`, e.toString()));
}

function writeFile(filePath, data, encoding = 'utf8') {
  return new Promise((resolve, reject) => {
    const content = typeof data === 'object' ? JSON.stringify(data, null, 2) + '\n' : data;
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);

    fs.writeFile(filePath, content, encoding, (err) => {
      log(err ? `${fileName} was not written to ${dirName}` : `${fileName} was successfully written to ${dirName}`);
      err ? reject(err) : resolve();
    });
  });
}

function pathExists(path) {
  return new Promise((resolve) => fs.exists(path, resolve));
}

function findFiles(globPattern, dir) {
  return new Promise((resolve, reject) => {
    log(`looking for ${globPattern} files in ${dir}`);
    const globOptions = {
      cwd: dir,
      nocase: true
    };
    glob(globPattern, globOptions, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        const fullPathes = matches.map(match => path.join(dir, match));
        resolve(fullPathes);
      }
    });
  });
}

function findJsons(globPattern, dir) {
  return findFiles(globPattern, dir).then((jsonFiles) => {
    const sortedJsonFiles = jsonFiles.sort(sortByModifiedAt);
    log(`found ${sortedJsonFiles.length} ${globPattern} files`);

    return allSettled(sortedJsonFiles.map(readJsonFile)).then((results) => {
      return results.reduce((jsons, result, index) => {
        if (isResolved(result)) {
          jsons.push({
            json: result.value,
            dirname: path.dirname(sortedJsonFiles[index])
          });
        }
        return jsons;
      }, []);
    });
  });
}

function sortByModifiedAt(fullpathA, fullpathB) {
  const [ modifiedA, modifiedB ] = [fullpathA, fullpathB]
    .map((fullPath) => path.dirname(fullPath))
    .map((dirname) => fs.lstatSync(dirname))
    .map(( { mtime } ) => mtime.getTime());

  return modifiedB - modifiedA;
}

function copy(src, dest, { overwrite = true }) {
  return new Promise((resolve, reject) => {
    log(`Copying ${src} to ${dest}`);
    Promise.resolve(overwrite ? pathExists(dest) : false)
      .then(exists =>
        exists
          ? throw new Error(`Skip copying file ${dest} as it already exists.`)
          : fs.copyFile(src, dest, (err) => err ? reject() : resolve()))
      .catch(reject)
  });
}
