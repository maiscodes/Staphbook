import path from 'path';
import fs from 'fs';
/*
 * getAnnotations
 * Find the annotations within the relevant directory for a
 *  given runName
 * @param {string} runName - name of the run/folder
 * @return {object} - object with annotations from prokka
 * TODO: return path to downloadable files maybe?
 */
export default async function getAnnotations() {
    if (!runName || !process.env.SAMPLES_DIR) {
        console.error(`runName or SAMPLES_DIR not set`);
        return {};
    }
    // get the path to the annotations
    const annotationPath = path.join(
        process.env.SAMPLES_DIR,
        runName,
        'bactopia-main',
        'annotator',
        'prokka',
    );
    // check folder exists
    if (!fs.existsSync(annotationPath)) {
        console.error(`Could not find annotations at ${annotationPath}`);
        return {};
    }
    // get the annotations from {runName}.txt
    const annotationFile = path.join(annotationPath, `${runName}.txt`);
    if (!fs.existsSync(annotationFile)) {
        console.error(`Could not find annotation file ${annotationFile}`);
        return {};
    }
    const annotations = fs.readFileSync(annotationFile, 'utf8');
    // stored as key: value on each line
    const annotationsObj: { [key: string]: string } = {};
    annotations.split('\n').forEach((line) => {
        const [key, value] = line.split(':');
        annotationsObj[key?.trim()] = value?.trim();
    });
    console.log(annotationsObj);
    return annotationsObj;
}
