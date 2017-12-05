const { readdirSync, statSync } = require('fs');

const getFilename = (path, name) => `${path}/${name}`;

// Returns all absolute file paths to files in a directory, including subdirectories
function getAllFilePathsInDirectory(path, acc = []) {
    let res = acc;
    readdirSync(path)
        .forEach(fileName => {
            if (statSync(getFilename(path, fileName)).isDirectory()) {
                res = res.concat(...(getAllFilePathsInDirectory(getFilename(path, fileName))))
            } else {
                res = res.concat(getFilename(path, fileName))
            }
        });

    return res;
}

const reportTypes = {
    MUTATION: 'Mutation',
    BLACKLIST: 'Blacklist',
};


exports.getAllFilePathsInDirectory = getAllFilePathsInDirectory;