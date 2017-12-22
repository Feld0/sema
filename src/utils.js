const { readFileSync, readdirSync, statSync } = require('fs');

const CONFIG_FILENAME = 'semaconfig.json';
const DEFAULT_CONFIG = {
    jsonOutput: false,
};

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

function loadConfig(path = './') {
    try {
        const optionsFile = readFileSync(getFilename(path, CONFIG_FILENAME), 'utf-8');

        console.info("Found config file, importing options");
        return JSON.parse(optionsFile);
    } catch (e) {
        console.info("Could not read config file, returning default config.");
        return DEFAULT_CONFIG;
    }
}

const reportTypes = {
    MUTATION: 'Mutation',
    BLACKLIST: 'Blacklist',
};


exports.getAllFilePathsInDirectory = getAllFilePathsInDirectory;
exports.loadConfig = loadConfig;
