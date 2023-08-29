const fs = require("fs");
const getAllSampleNames = require("./getAllSampleNames");
const log = require("debug")("utils:getMashDistances");
const { exec } = require("child_process");

/**
    * Performs a 1vALL mash comparison of a sample to all other available samples
    * @requires {string} process.env.SAMPLES_DIR - path to samples directory
    * @requires {string} mash - mash executable on path
    * @param {string} sampleName - name of sample to compare to all other samples
    * @param {31 | 21} kmers - kmer size to use for mash
    * @returns {Object} - object with keys of other sample names and values of mash distances
    */
async function getMashDistances(sampleName, kmers = 31) {
    const allSamples = getAllSampleNames();
    const mashPaths = allSamples.map((sample) => `${process.env.SAMPLES_DIR}/${sample}/bactopia-main/sketcher/${sample}-k${kmers}.msh`);
    // double check files exist, remove if not
    mashPaths.forEach((path) => {
        if (!fs.existsSync(path)) {
            mashPaths.splice(mashPaths.indexOf(path), 1);
            log(`File ${path} does not exist, removing from mashPaths`);
        }
    });
    // place this sample at the front of the array
    mashPaths.unshift(`${process.env.SAMPLES_DIR}/${sampleName}/bactopia-main/sketcher/${sampleName}-k${kmers}.msh`);

    const distances = {};

    return new Promise((resolve, reject) => {
        exec(`mash dist -t ${mashPaths.join(' ')}`, (err, stdout, stderr) => {
            if (err) {
                log(err);
            }
            else {
                // parse stdout as TSV
                lines = stdout.split('\n');
                // remove first line with headers
                lines.shift();
                // remove last line with empty string
                lines.pop();
                lines.forEach((line) => {
                    const [other, similarity] = line.split('\t');
                    distances[other] = similarity;
                });
            }
            resolve(distances);
        });
    });
}

module.exports = getMashDistances;
