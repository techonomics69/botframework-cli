parser grammar LUFileParser;

options { tokenVocab=LUFileLexer; }

file
	: paragraph+? EOF
	;

paragraph
    : newline
    | nestedIntentSection
    | simpleIntentSection
    | entitySection
    | newEntitySection
    | importSection
    | qnaSection
    | modelInfoSection
    ;

// Treat EOF as newline to hanle file end gracefully
// It's possible that parser doesn't even have to handle NEWLINE, 
// but before the syntax is finalized, we still keep the NEWLINE in grammer 
newline
    : WS* (NEWLINE | EOF)
    ;

nestedIntentSection
    : nestedIntentNameLine newline+ nestedIntentBodyDefinition
    ;

nestedIntentNameLine
    : WS* HASH nestedIntentName
    ;

nestedIntentName
    : nameIdentifier (WS|nameIdentifier)*
    ;

nameIdentifier
    : IDENTIFIER (DOT IDENTIFIER)*
    ;

nestedIntentBodyDefinition
    : subIntentDefinition+
    ;

subIntentDefinition
    : WS* HASH simpleIntentSection
    ;

simpleIntentSection
    : intentDefinition (entitySection | newEntitySection)*
    ;

intentDefinition
	: intentNameLine newline intentBody?
	;

intentNameLine
	: WS* HASH HASH? intentName
	;

intentName
    : nameIdentifier (WS|nameIdentifier)*
    ;

intentBody
	: WS* normalIntentBody
	;

normalIntentBody
    : WS* (normalIntentString newline)+
    ;

normalIntentString
	: WS* DASH (WS|TEXT|EXPRESSION|ESCAPE_CHARACTER)*
	;

newEntitySection
    : newEntityDefinition
    ;

newEntityDefinition
    : newEntityLine newline newEntityListbody?
    ;

newEntityListbody
    : (normalItemString newline)+
    ;

newEntityLine
    : WS* AT newEntityType? (newEntityName|newEntityNameWithWS) newEntityRoles? newEntityUsesFeatures? NEW_EQUAL? (newCompositeDefinition|newRegexDefinition)?
    ;

newCompositeDefinition
    : NEW_COMPOSITE_ENTITY
    ;

newRegexDefinition
    : NEW_REGEX_ENTITY
    ;

newEntityType
    : NEW_ENTITY_TYPE_IDENTIFIER
    ;

newEntityRoles
    : HAS_ROLES_LABEL? newEntityRoleOrFeatures
    ;

newEntityUsesFeatures
    : HAS_FEATURES_LABEL newEntityRoleOrFeatures
    ;

newEntityRoleOrFeatures
    : text (COMMA text)*
    ;

text
    : NEW_TEXT | NEW_ENTITY_IDENTIFIER
    ;

newEntityName
    : NEW_ENTITY_TYPE_IDENTIFIER | NEW_ENTITY_IDENTIFIER
    ;

newEntityNameWithWS
    : NEW_ENTITY_IDENTIFIER_WITH_WS
    ;

entitySection
    : entityDefinition
    ;

entityDefinition
    : entityLine newline entityListBody?
    ;
    
entityLine
    : WS* DOLLAR entityName COLON_MARK entityType
    ;

entityName
    : (ENTITY_TEXT|WS)*
    ;

entityType
    : (compositeEntityIdentifier|regexEntityIdentifier|ENTITY_TEXT|COLON_MARK|WS)*
    ;

compositeEntityIdentifier
    : COMPOSITE_ENTITY
    ;

regexEntityIdentifier
    : REGEX_ENTITY
    ;

entityListBody
    : (normalItemString newline)+
    ;

normalItemString
    : WS* DASH (WS|TEXT|EXPRESSION)*
    ;

importSection
    : importDefinition
    ;

importDefinition
    : IMPORT_DESC IMPORT_PATH
    ;

qnaSection
    : qnaDefinition
    ;

qnaDefinition
    : qnaQuestion moreQuestionsBody qnaAnswerBody
    ;

qnaQuestion
    : WS* QNA questionText newline
    ;

questionText
    : (WS|QNA_TEXT)*
    ;

moreQuestionsBody
    : WS* (moreQuestion newline)*
    ;

moreQuestion
    : DASH (WS|TEXT)*
    ;

qnaAnswerBody
    : filterSection? multiLineAnswer
    ;

filterSection
    : WS* FILTER_MARK filterLine+
    ;

filterLine
    : WS* DASH (WS|TEXT)* newline
    ;

multiLineAnswer
    : WS* MULTI_LINE_TEXT
    ;

modelInfoSection
    : modelInfoDefinition
    ;

modelInfoDefinition
    : WS* MODEL_INFO
    ;