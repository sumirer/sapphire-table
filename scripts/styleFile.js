/* eslint-disable */

const fs = require('fs');
const path = require('path');

const sass = require('sass');

const command = process.argv;

const targetFilePath = command[2];

const outputFilePath = command[3];

/**
 *
 * @type {string[]}
 */
const dirName = targetFilePath.split('/');

const rawFileName = dirName.pop();

const fileName = rawFileName.split('.')[0];

const sourcePath = path.resolve(process.cwd(), targetFilePath);
const targetPath = path.resolve(process.cwd(), outputFilePath);

const parseResult = sass.compile(sourcePath).css;

if (!fs.existsSync(targetPath)) {
	fs.mkdirSync(targetPath);
}

fs.writeFileSync(path.resolve(targetPath, fileName + '.css'), parseResult, 'utf8');

fs.copyFileSync(sourcePath, path.resolve(targetPath, rawFileName));

console.log('parse style file done..');
