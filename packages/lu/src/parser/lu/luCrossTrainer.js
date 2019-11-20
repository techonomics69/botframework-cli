const retCode = require('./../utils/enums/CLI-errors')
const helpers = require('./../utils/helpers')
const exception = require('./../utils/exception')
const luParser = require('./../lufile/luParser');
const SectionOperator = require('./../lufile/sectionOperator');
const LUSectionTypes = require('./../utils/enums/lusectiontypes');
const DiagnosticSeverity = require('./../lufile/diagnostic').DiagnosticSeverity;

module.exports = {
    /**
     * Do cross training among lu files
     * @param {luObject[]} luArray the luObject list to be parsed
     * @param {luObject[]} rootLuArray root luObject list
     * @param {Map<string, Map<string, string>>} luConfig cross train config 
     * @param {string} intentName interuption intent name
     * @param {boolean} verbose verbose logging
     * @returns {Map<string, LUResource>} Map of file id and luResource
     * @throws {exception} Throws on errors. exception object includes errCode and text
     */
    luCrossTrain: async function (luArray, rootLuArray, luConfig, intentName, verbose) {
        try {
            let fileIdToLuResourceMap = new Map();
            for (const luFile of luArray) {
                let luContent = luFile.content;
                luContent = helpers.sanitizeNewLines(luContent);
                if (luContent === undefined || luContent === '') {
                    continue;
                }

                let luResource = luParser.parse(luContent);
                if (luResource.Errors && luResource.Errors.length > 0) {
                    if (verbose) {
                        var warns = luResource.Errors.filter(error => (error && error.Severity && error.Severity === DiagnosticSeverity.WARN));
                        if (warns.length > 0) {
                            process.stdout.write(warns.map(warn => warn.toString()).join('\n').concat('\n'));
                        }
                    }

                    var errors = luResource.Errors.filter(error => (error && error.Severity && error.Severity === DiagnosticSeverity.ERROR));
                    if (errors.length > 0) {
                        throw (new exception(retCode.errorCode.INVALID_LINE, errors.map(error => error.toString()).join('\n')));
                    }
                }

                fileIdToLuResourceMap.set(luFile.id, luResource);
            }

            /*
            resources is array of below object
            {
                id: a.lu
                content: LUResource
                children: [ { intent: "b", target: "b.lu"} , {intent:  "c", target: "c.lu"}]
            }
            */
            let resources = [];
            let fileIdsFromInput = Array.from(fileIdToLuResourceMap.keys());
            for (const fileId of fileIdsFromInput) {
                let luResource = fileIdToLuResourceMap.get(fileId);
                let resource = {
                    id: fileId,
                    content: luResource,
                    children: []
                };

                if (luConfig.has(fileId)) {
                    let intents = [];
                    for (const section of luResource.Sections) {
                        if (section.SectionType === LUSectionTypes.SIMPLEINTENTSECTION 
                            || section.SectionType === LUSectionTypes.NESTEDINTENTSECTION) {
                            intents.push(section);
                        }
                    }

                    for (const intent of intents) {
                        const name = intent.Name;
                        if (name !== intentName) {
                            const referencedFileId = luConfig.get(fileId).get(name);
                            if (referencedFileId) {
                                if (fileIdsFromInput.includes(referencedFileId)) {
                                    resource.children.push({
                                        intent: name,
                                        target: referencedFileId
                                    });
                                }
                            }
                        }
                    }
                }

                resources.push(resource);
            }

            const rootResources = resources.filter(r => rootLuArray.some(root => root.id === r.id));
            const result = this.crossTrain(rootResources, resources, intentName);
            for (const res of result) {
                fileIdToLuResourceMap.set(res.id, res.content);
            }

            return fileIdToLuResourceMap;
        } catch (err) {
            throw (err)
        }
    },

    /**
     * Cross training core function
     * @param {any[]} rootResources the root resource object list
     * @param {any[]} resources all resource object list
     * @param {string} intentName interuption intent name
     * @returns {any[]} updated resource objects
     * @throws {exception} Throws on errors. exception object includes errCode and text
     */
    crossTrain: function (rootResources, resources, intentName) {
        const idToResourceMap = new Map();
        for (const resource of resources) {
            idToResourceMap.set(resource.id, resource);
        }

        for (const id of idToResourceMap.keys()) {
            let resource = idToResourceMap.get(id);
            let children = resource.children;
            for (const child of children) {
                let intent = child.intent;
                if (idToResourceMap.has(child.target)) {
                    const contentList = resource.content.Content.split(/\r?\n/);
                    const brotherSections = resource.content.Sections.filter(s => s.Name !== intent 
                        && s.Name !== intentName 
                        && (s.SectionType === LUSectionTypes.SIMPLEINTENTSECTION || s.SectionType === LUSectionTypes.NESTEDINTENTSECTION));
                    
                    let brotherEntityDict = new Map();
                    let brotherUtterances = [];
                    brotherSections.forEach(s => {
                        if (s.SectionType === LUSectionTypes.SIMPLEINTENTSECTION) {
                            brotherUtterances = brotherUtterances.concat(s.UtteranceAndEntitiesMap.map(u => u.context.getText().trim()));
                            s.Entities.forEach(e => {
                                const startLine = e.ParseTree.start.line - 1;
                                const endLine = e.ParseTree.stop.line - 1;
                                brotherEntityDict.set(e.Name, contentList.slice(startLine, endLine + 1).join('\r\n'));
                            })
                        } else {
                            s.SimpleIntentSections.forEach(section => {
                                brotherUtterances = brotherUtterances.concat(section.UtteranceAndEntitiesMap.map(u => u.context.getText().trim()));
                            })
                            
                            s.SimpleIntentSections.forEach(s => {
                                s.Entities.forEach(e => {
                                    const startLine = e.ParseTree.start.line - 1;
                                    const endLine = e.ParseTree.stop.line - 1;
                                    brotherEntityDict.set(e.Name, contentList.slice(startLine, endLine + 1).join('\r\n'));
                                })
                            })
                        }
                    });

                    let targetResource = idToResourceMap.get(child.target);

                    // Merge direct brother's utterances and entities
                    targetResource = this.mergeInteruptionIntent(brotherUtterances, brotherEntityDict, targetResource, intentName);
                    idToResourceMap.set(targetResource.id, targetResource);
                }
            }
        }

        // Parse resources
        for (const rootResource of rootResources) {
            rootResource.visited = true;
            this.mergeRootInteruptionToLeaves(rootResource, idToResourceMap, intentName);
        }

        return Array.from(idToResourceMap.values());
    },

    mergeRootInteruptionToLeaves: function (rootResource, result, intentName) {
        if (rootResource && rootResource.children && rootResource.children.length > 0) {
            for (const child of rootResource.children) {
                let childResource = result.get(child.target);
                if (childResource.visited !== undefined && childResource.visited === true) {
                    throw (new exception(retCode.errorCode.INVALID_INPUT, `Loop detected for lu file ${childResource.id} when doing cross training.`));
                }

                const newChildResource = this.mergeFatherInteruptionToChild(rootResource, childResource, intentName);
                result.set(child.target, newChildResource);
                newChildResource.visited = true;
                this.mergeRootInteruptionToLeaves(newChildResource, result, intentName);
            }
        }
    },

    mergeFatherInteruptionToChild: function (fatherResource, childResource, intentName) {
        const fatherInteruptions = fatherResource.content.Sections.filter(s => s.Name === intentName);
        if (fatherInteruptions && fatherInteruptions.length > 0) {
            const fatherInteruption = fatherInteruptions[0];
            const fatherUtterances = fatherInteruption.UtteranceAndEntitiesMap.map(u => u.context.getText());
            const fatherContentList = fatherResource.content.Content.split(/\r?\n/);
            let fatherEntityDict = new Map();
            fatherInteruption.Entities.forEach(x => {
                const startLine = x.ParseTree.start.line - 1;
                const endLine = x.ParseTree.stop.line - 1;
                fatherEntityDict.set(x.Name, fatherContentList.slice(startLine, endLine + 1).join('\r\n'));
            });

            childResource = this.mergeInteruptionIntent(fatherUtterances, fatherEntityDict, childResource, intentName);
        }

        return childResource;
    },

    mergeInteruptionIntent: function (fromUtterances, fromEntityDict, toResource, intentName) {
        const toInteruptions = toResource.content.Sections.filter(section => section.Name === intentName);
        const toContentList = toResource.content.Content.split(/\r?\n/);
        let interuptionEntities = [];
        if (toInteruptions && toInteruptions.length > 0) {
            const toInteruption = toInteruptions[0];
            const existingUtterances = toInteruption.UtteranceAndEntitiesMap.map(u => u.context.getText().trim().slice(1).trim());
            // construct new content here
            let newFileContent = '';
            fromUtterances.forEach(utterance => {
                if (!existingUtterances.includes(utterance.trim().slice(1).trim())) {
                    newFileContent += '- ' + utterance.trim().slice(1).trim() + '\r\n';
                }
            });

            toInteruption.Entities.forEach(e => {
                const startLine = e.ParseTree.start.line - 1;
                const endLine = e.ParseTree.stop.line - 1;
                interuptionEntities.push(toContentList.slice(startLine, endLine + 1).join('\r\n'));
            });

            const existingEntityNames = toInteruption.Entities.map(e => e.Name);
            fromEntityDict.forEach(nameContentPair => {
                if (!existingEntityNames.includes(nameContentPair[0])) {
                    interuptionEntities.push(nameContentPair[1]);
                }
            })

            if (newFileContent !== '') {
                newFileContent = toInteruption.ParseTree.intentDefinition().getText().trim() + '\r\n' + newFileContent;
                let lines = newFileContent.split(/\r?\n/);
                let newLines = [];
                lines.forEach(line => {
                    if (line.trim().startsWith('-')) {
                        newLines.push('- ' + line.trim().slice(1).trim());
                    } else if (line.trim().startsWith('##')) {
                        newLines.push('## ' + line.trim().slice(2).trim());
                    } else if (line.trim().startsWith('#')) {
                        newLines.push('# ' + line.trim().slice(1).trim());
                    }
                })

                newFileContent = newLines.join('\r\n');

                if (interuptionEntities && interuptionEntities.length > 0) {
                    newFileContent += '\r\n\r\n' + interuptionEntities.join('\r\n\r\n') + '\r\n';
                }

                // update section here
                toResource.content = new SectionOperator(toResource.content).updateSection(toInteruption.Id, newFileContent);
            }
        } else {
            // construct new content here
            if (fromUtterances && fromUtterances.length > 0) {
                let newFileContent = `\r\n# ${intentName}\r\n`;
                fromUtterances.forEach(utterance => newFileContent += '- ' + utterance.trim().slice(1).trim() + '\r\n');
                interuptionEntities = Array.from(fromEntityDict.values());
                if (interuptionEntities && interuptionEntities.length > 0) {
                    newFileContent += '\r\n' + interuptionEntities.join('\r\n\r\n') + '\r\n';
                }

                // add section here
                toResource.content = new SectionOperator(toResource.content).addSection(newFileContent);
            }
        }

        return toResource;
    }
}
