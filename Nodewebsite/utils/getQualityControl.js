import path from 'path';
import fs from 'fs';
/**
 * Get names of quality control files for a specific sample
 * NOTE: Bactopia generates some HTML for QC, so can likely return those files
 * in the future
 * @param {string} runName - name of the run/folder
 * @return {object} - object with names of QC files
 */
export default async function getQualityControl(runName) {
    // so just return the names and paths of files in the QC directory
    // return as { [key: string]: string }[]
    if (!runName || !process.env.SAMPLES_DIR) {
        console.error(`runName or SAMPLES_DIR not set`);
        return {};
    }
    const qcDir = path.join(process.env.SAMPLES_DIR, runName, 'bactopia-main', 'qc', 'summary');
    if (!fs.existsSync(qcDir)) {
        console.error(`Could not find QC directory ${qcDir}`);
        return {};
    }
    const qcFiles = fs.readdirSync(qcDir);
    // filter to html files
    const qcFilesObj = [];
    qcFiles.forEach((file) => {
        if (file.endsWith('.html')) {
            qcFilesObj.push({
                name: file.replace('.html', ''),
            });
        }
    });
    return qcFilesObj;
}
