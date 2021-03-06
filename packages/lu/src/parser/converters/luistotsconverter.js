const parse_multi_platform_luis_1 = require('./../luis/propertyHelper');
const LuisGenBuilder = require('./../luis/luisGenBuilder')
const Writer = require('./helpers/writer')

module.exports = {
    writeFromLuisJson: async function(luisJson, className, outPath) {
        const app = LuisGenBuilder.build(luisJson);
        let writer = new Writer();
        writer.indentSize = 2;
        await writer.setOutputStream(outPath);
        this.header(writer);
        this.intents(app, writer);
        this.entities(app, writer);
        this.classInterface(className, writer);
        await writer.closeOutputStream();
    },
    header: function(writer) {
        writer.writeLine([
            '/**',
            ' * <auto-generated>',
            ' * Code generated by luis:generate:ts',
            ' * Tool github: https://github.com/microsoft/botframwork-cli',
            ' * Changes may cause incorrect behavior and will be lost if the code is',
            ' * regenerated.',
            ' * </auto-generated>',
            ' */',
            "import {DateTimeSpec, GeographyV2, InstanceData, IntentData, NumberWithUnits, OrdinalV2} from 'botbuilder-ai'"
        ]);
    },
    intents: function(app, writer) {
        writer.writeLine();
        writer.writeLineIndented('export interface GeneratedIntents {');
        writer.increaseIndentation();
        app.intents.forEach((intent) => {
            writer.writeLineIndented(`${parse_multi_platform_luis_1.normalizeName(intent)}: IntentData`);
        });
        writer.decreaseIndentation();
        writer.writeLine('}');
    },
    entities: function(app, writer) {
        // Composite instance and data
        app.composites.forEach((composite) => {
            let name = parse_multi_platform_luis_1.normalizeName(composite.compositeName);
            writer.writeLine();
            writer.writeLineIndented(`export interface GeneratedInstance${name} {`);
            writer.increaseIndentation();
            composite.attributes.forEach((attribute) => {
                writer.writeLineIndented(`${parse_multi_platform_luis_1.jsonPropertyName(attribute)}?: InstanceData[]`);
            });
            writer.decreaseIndentation();
            writer.writeLineIndented('}');
            writer.writeLineIndented(`export interface ${name} {`);
            writer.increaseIndentation();
            composite.attributes.forEach(attribute => {
                writer.writeLineIndented(this.getEntityWithType(attribute, this.isList(attribute, app)));
            });
            writer.writeLineIndented(`$instance?: GeneratedInstance${name}`);
            writer.decreaseIndentation();
            writer.writeLineIndented('}');
        });
        writer.writeLine();
        // Entity instance
        writer.writeLineIndented('export interface GeneratedInstance {');
        writer.increaseIndentation();
        app.getInstancesList().forEach(instance => {
            writer.writeLineIndented(`${parse_multi_platform_luis_1.jsonPropertyName(instance)}?: InstanceData[]`);
        });
        writer.decreaseIndentation();
        writer.writeLineIndented('}');
        // Entities
        writer.writeLine();
        writer.writeLineIndented('export interface GeneratedEntities {');
        writer.increaseIndentation();
        this.writeEntityGroup(app.entities, '// Simple entities', writer);
        writer.writeLineIndented('// Built-in entities');
        app.prebuiltEntities.forEach(builtInEntity => {
            builtInEntity.forEach(entity => {
                writer.writeLineIndented(this.getEntityWithType(entity));
            });
        });
        writer.writeLine();
        this.writeEntityGroup(app.closedLists, '// Lists', writer, true);
        this.writeEntityGroup(app.regex_entities, '// Regex entities', writer);
        this.writeEntityGroup(app.patternAnyEntities, '// Pattern.any', writer);
        // Composites
        writer.writeLineIndented('// Composites');
        app.composites.forEach(composite => {
            writer.writeLineIndented(`${composite.compositeName}?: ${composite.compositeName}[]`);
        });
        writer.writeLineIndented('$instance: GeneratedInstance');
        writer.decreaseIndentation();
        writer.writeLineIndented('}');
    },
    classInterface: function(className, writer) {
        writer.writeLine();
        writer.writeLineIndented(`export interface ${className} {`);
        writer.increaseIndentation();
        writer.writeLineIndented([
            'text: string',
            'alteredText?: string',
            'intents: GeneratedIntents',
            'entities: GeneratedEntities',
            '[propName: string]: any'
        ]);
        writer.decreaseIndentation();
        writer.writeLineIndented('}');
    },
    writeEntityGroup: function(entityGroup, description, writer, isListType = false) {
        writer.writeLineIndented(description);
        entityGroup.forEach(entity => {
            writer.writeLineIndented(this.getEntityWithType(entity, isListType));
        });
        writer.writeLine();
    },
    isList: function(entityName, app) {
        return app.closedLists.includes(entityName);
    },
    getEntityWithType: function(entityName, isListType = false) {
        let result = '';
        switch (isListType ? 'list' : entityName) {
            case 'age':
            case 'dimension':
            case 'money':
            case 'temperature':
                result = '?: NumberWithUnits[]';
                break;
            case 'geographyV2':
                result = '?: GeographyV2[]';
                break;
            case 'ordinalV2':
                result = '?: OrdinalV2[]';
                break;
            case 'number':
            case 'ordinal':
            case 'percentage':
                result = '?: number[]';
                break;
            case 'datetimeV2':
                result = '?: DateTimeSpec[]';
                break;
            case 'list':
                result = '?: string[][]';
                break;
            default:
                result = '?: string[]';
        }
        return parse_multi_platform_luis_1.jsonPropertyName(entityName) + result;
    }
}