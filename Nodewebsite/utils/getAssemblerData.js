import fs from 'fs';
import path from 'path';

/** Get assembly data about a sample. This includes the makeup
 * of the genome (contigs, etc) and the assembly statistics
 * @param {string} runName - name of the run/folder
 * @return {object} - object with key: value metadata from assembler
 */
export default function getAssemblerData(runName) {
    // it's just a tsv
    // return as  { [key: string]: string }[]
    // probably only one row from what I can see, but leave room
    if (!runName || !process.env.SAMPLES_DIR) {
        console.error(`runName or SAMPLES_DIR not set`);
        return {};
    }
    const assemblerFile = path.join(
        process.env.SAMPLES_DIR,
        runName,
        'bactopia-main',
        'assembler',
        runName + '.tsv',
    );
    if (!fs.existsSync(assemblerFile)) {
        console.error(`Could not find assembler file ${assemblerFile}`);
        return {};
    }
    const assemblerData = fs.readFileSync(assemblerFile, 'utf8');
    // parse as tsv file
    const assemblerDataObj = [];
    const lines = assemblerData.split('\n');
    const headers = lines[0].split('\t');
    lines.slice(1).forEach((line) => {
        const row = line.split('\t');
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        assemblerDataObj.push(obj);
    });
    return assemblerDataObj;
}
