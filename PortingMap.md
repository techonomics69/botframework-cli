# Notice of new Bot Framework (BF) CLI

The Bot Framework team has been working on consolidating the command line interface toolset for managing bots. The new tool, BF provides a one-stop tool that embeds the functionality of the old tools collection. 

The new tool is designed based on JavaScript [OClif Framework](https://github.com/oclif/oclif). 

The principles guiding the tool include:

* Unified and consistent user interface across all command groups
* Common utilities library
* Instrumentation to collect anonymous usage statistics to help prioritize investment areas (Optional user Opt-in, disabled by default)
* High quality bar in all releases by embedded testing in nightly builds
* Extensible plug-in architecture for future tools

## Frequently Asked Questions

### Can I still use the old tools?
Yes, until we introduce a breaking change to the protocol (no plan yet).

### What about all issues, improvement requests that were filed for the old tool?
We have ported, and will address all issues in the new tool.

### Is there a cut-off date for the old tools?
Not yet, but in general as soon as the the functionality is available for General Availability the old tools will be assumed deprecated.

## Tool Command Map

Commands invoked by BF [New Command] as follows:

| New Command | Old Tool(s) | Status  |
| ----------- | ----------- | ------- |
| Chatdown    | Chatdown    | Preview |
| QnAMaker    | QnAMaker    | Preview |
| LUIS        | LuDown      | Preview |
| LUIS        | LuisGen     | Preview |
| LUIS        | LUIS (api)  | TBD     |
| LG          | MSLG        | TBD     |
| Dispatch    | Dispatch    | TBD     |
| Dialog      | \<new\>     | TBD     |





## See Also

* [BF CLI](https://github.com/microsoft/botframework-cli) main page
