export class DialogFileContent {
    public Contents: Array<Content>;

    constructor(contents: Array<Content>) {
        this.Contents = contents;
    }
}

export class Content {
    public ID: string; 
    public Path: string;
    public Content: string;
    public Locale: string | undefined;
    public Name: string; // defaults to "<id>.<locale>.lu" for lu files

    constructor(id: string, path: string, content: string, locale?: string, name?: string) {
        this.ID = id;
        this.Path = path;
        this.Content = content;
        this.Locale = locale;
        if (name && name !== '') {
            this.Name = name
        } else {
            if (this.Locale) {
                if (this.Locale !== '') {
                    this.Name = id + '.' + this.Locale + '.lu';
                } else {
                    this.Name = id + '.lu';
                }
            } else {
                this.Name = this.ID;
            }
        }
    }
};

export class LUISConfig {
    public AuthoringKey:string;
    public BotName:string;
    public Culture:string = 'en-us';
    public AuthoringRegion:string = 'westus';
    public EnvironmentName:string = 'dev';
    public GenerateDialogFileContent:boolean = false;
    public FallBackLocale:string = 'en-us';
    public LuContents: Array<Content>;
    public MultiLangRecognizerDialogPath: string;
    public LuisSettingsPath: string;

    constructor(
        authoringKey: string, 
        botName: string,
        culture: string,
        authoringRegion: string,
        environmentName: string,
        generateDialogFileContent: boolean,
        fallBackLocale: string,
        luContents: Array<Content>,
        multiLangRecognizerDialogPath: string,
        luisSettingsPath: string) {
            this.AuthoringKey = authoringKey,
            this.BotName = botName,
            this.Culture = culture,
            this.AuthoringRegion = authoringRegion,
            this.EnvironmentName = environmentName,
            this.GenerateDialogFileContent = generateDialogFileContent,
            this.FallBackLocale = fallBackLocale,
            this.LuContents = luContents,
            this.MultiLangRecognizerDialogPath = multiLangRecognizerDialogPath,
            this.LuisSettingsPath = luisSettingsPath
        }
};