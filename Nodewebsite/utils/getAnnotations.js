const fs = require("fs");
const path = require("path");

/*
 * getAnnotations
 * Find the annotations within the relevant directory for a
 *  given runName
 * @param {string} runName - name of the run/folder
 * @return {object} - object with annotations from prokka
 */
function getAnnotations(runName) {
  if (!runName || !process.env.SAMPLES_DIR) {
    console.error(`runName or SAMPLES_DIR not set`);
    return null;
  }
  // get the path to the annotations
  const annotationPath = path.join(
    process.env.SAMPLES_DIR,
    runName,
    "bactopia-main",
    "annotator",
    "prokka"
  );
  // check folder exists
  if (!fs.existsSync(annotationPath)) {
    console.error(`Could not find annotations at ${annotationPath}`);
    return null;
  }
  // get the annotations from {runName}.txt
  const annotationFile = path.join(annotationPath, `${runName}.tsv`);
  if (!fs.existsSync(annotationFile)) {
    console.error(`Could not find annotation file ${annotationFile}`);
    return null;
  }
  // read the file into tsv as an array of objects
    const annotations = fs.readFileSync(annotationFile, "utf8").split('\n');
    console.log(annotations);
    const headers = annotations.shift().split("\t");
    const annotationsArr = annotations.map((line) => {
        const obj = {};
        line.split("\t").forEach((value, index) => {
            obj[headers[index]] = value;
        });
        return obj;
    });
  return annotationsArr;
}

module.exports = getAnnotations;
