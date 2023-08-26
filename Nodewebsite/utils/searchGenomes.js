const path = require('path')
const fs = require('fs')
const glob = require('glob')
const log = require('debug')('utils:searchGenomes')

const categories = {
    'name': "/*",
    'annotations': '/**/annotator/prokka/*.tsv',
    'species':  '/**/gather/*.tsv',
    'sequence_type': '/**/mlst/*.tsv',
    /**
    sra_accession
     **/
}



/**
 * Search function.
 * Takes a query and category.
 * Searches within all files that match the categories glob pattern.
 * If the query is present within any of those files, return the filenames.
 * @param {string} query
 * @param {"name"|"annotations"|"species"|"sequence_type"} category
 */
function searchGenomes(query, category) {
    // join the glob with the samplesdir env var
    if (!categories[category]) {
        throw new Error('Invalid category: ' + category + '. Valid categories are: ' + Object.keys(categories).join(', ') + '. ')
    }
    // Name search is easy
    if (category === 'name') {
        // search for the name in the samples dir
        const all_folders = fs.readdirSync(process.env.SAMPLES_DIR)
        const results = []
        for (const folder of all_folders) {
            if (folder.toLowerCase().includes(query.toLowerCase())) {
                results.push(folder)
            }
        }
        return results
    }

    const pattern = path.join(process.env.SAMPLES_DIR, categories[category])
    log(pattern)
    const files = glob.sync(pattern, {posix: true, dotRelative: true, windowsPathsNoEscape: true})
    log(`Searching ${files.length} files for ${query}`)
    const queries = query.split(',').map((q) => q.trim())
    const results = []
    for (const file of files) {
        const data = fs.readFileSync(file, 'utf8')
        if (queries.every((q) => data.toLowerCase().includes(q.toLowerCase()))) {
            // found the text, add the sample name to the results
            // sample name is the directory name right after the SAMPLES_DIR
            // this line splits the whole path to remove samples_dir, and 
            // then splits and takes the first dir after
            const sampleName = file.split(process.env.SAMPLES_DIR)[1].split("/")[1]
            results.push(sampleName)
        }
    }
    return results
}

module.exports = searchGenomes
