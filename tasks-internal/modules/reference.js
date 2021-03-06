/// <reference path="../../defs/tsd.d.ts"/>
"use strict";
var _ = require("lodash");
var fs = require("fs");
var grunt = require("grunt");
var utils = require("./utils");
/////////////////////////////////////////////////////////////////////
// Reference file logic
////////////////////////////////////////////////////////////////////
// Updates the reference file
function updateReferenceFile(files, generatedFiles, referenceFile, referencePath, eol) {
    var referenceIntro = '/// <reference path="';
    var referenceEnd = '" />';
    var referenceMatch = /\/\/\/ <reference path=\"(.*?)\"/;
    var ourSignatureStart = '//grunt-start';
    var ourSignatureEnd = '//grunt-end';
    // remove the generated files from files:
    files = _.difference(files, generatedFiles);
    var lines = []; // All lines of the file
    var origFileLines = []; // The lines we do not modify and send out as is. Lines will we reach grunt-ts generated
    var origFileReferences = []; // The list of files already there that we do not need to manage
    // Location of our generated references
    // By default at start of file
    var signatureSectionPosition = 0;
    var i;
    // Read the original file if it exists
    var referenceContents = '';
    if (fs.existsSync(referenceFile)) {
        referenceContents = fs.readFileSync(referenceFile).toString();
        lines = referenceContents.split(/\r\n|\r|\n/);
        var inSignatureSection = false;
        // By default our signature goes at end of file
        signatureSectionPosition = lines.length;
        for (i = 0; i < lines.length; i++) {
            var line = _.trim(lines[i]);
            // Skip logic for our generated section
            if (_.includes(line, ourSignatureStart)) {
                // Wait for the end signature:
                signatureSectionPosition = i;
                inSignatureSection = true;
                continue;
            }
            if (_.includes(line, ourSignatureEnd)) {
                inSignatureSection = false;
                continue;
            }
            if (inSignatureSection) {
                continue;
            }
            // store the line
            origFileLines.push(line);
            // Fetch the existing reference's filename if any:
            if (_.includes(line, referenceIntro)) {
                var match = line.match(referenceMatch);
                var filename = match[1];
                origFileReferences.push(filename);
            }
        }
    }
    // Put in the generated files
    generatedFiles = _.map(generatedFiles, function (file) { return referenceIntro + utils.makeRelativePath(referencePath, file) + referenceEnd; });
    var contents = utils.insertArrayAt([ourSignatureStart], 1, generatedFiles);
    // Put in the new / observed missing files:
    files.forEach(function (filename) {
        // The file we are about to add
        var filepath = utils.makeRelativePath(referencePath, filename);
        // If there are orig references
        if (origFileReferences.length) {
            if (_.includes(origFileReferences, filepath)) {
                return;
            }
        }
        // Finally add the filepath
        contents.push(referenceIntro + filepath + referenceEnd);
    });
    contents.push(ourSignatureEnd);
    var updatedFileLines = utils.insertArrayAt(origFileLines, signatureSectionPosition, contents);
    var updatedFileContents = updatedFileLines.join(eol);
    // Modify the orig contents to put in our contents only if changed
    // Also Return whether the file was changed
    if (updatedFileContents !== referenceContents) {
        grunt.file.write(referenceFile, updatedFileContents);
        return true;
    }
    else {
        return false;
    }
}
exports.updateReferenceFile = updateReferenceFile;
//# sourceMappingURL=reference.js.map