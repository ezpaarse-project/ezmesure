# ezMESURE

## Enums

### HarvestJobStatus

Possible statuses of a harvest job

| Value       |
|-------------|
| waiting     |
| running     |
| delayed     |
| finished    |
| failed      |
| cancelled   |
| interrupted |

## Models

### Institution

An institution

| Property          | Type                    | Description                                                       | Attributes | Default  |
|-------------------|-------------------------|-------------------------------------------------------------------|------------|----------|
| id                | `String`                | ID of the institution                                             | Id         | `cuid()` |
| parentInstitution | `Institution?`          | The parent institution                                            |            |          |
| createdAt         | `DateTime`              | Creation date                                                     |            | `now()`  |
| updatedAt         | `DateTime`              | Latest update date                                                |            |          |
| name              | `String`                | Institution name                                                  |            |          |
| namespace         | `String?`               | Institution namespace (ex: b-bibcnrs)                             |            |          |
| validated         | `Boolean`               | Whether the institution has been validated or not                 |            | `false`  |
| hidePartner       | `Boolean`               | Whether the institution should appear in the partner list or not  |            | `false`  |
| tags              | `String[]`              | A list of tags associated to the institution                      |            |          |
| logoId            | `String?`               | ID of the institution logo                                        |            |          |
| type              | `String?`               | Institution type (ex: university)                                 |            |          |
| acronym           | `String?`               | Institution acronym                                               |            |          |
| websiteUrl        | `String?`               | Institution website URL                                           |            |          |
| city              | `String?`               | Institution city                                                  |            |          |
| uai               | `String?`               | Institution UAI (Unité Administrative Immatriculée)               |            |          |
| social            | `Json?`                 | Social links of the institution                                   |            |          |
| sushiReadySince   | `DateTime?`             | Date when SUSHI credentials have been marked as ready for harvest |            |          |
| memberships       | `Membership[]`          | Institution members                                               |            |          |
| elasticRoles      | `ElasticRole[]`         | Additional roles to give to each member                           |            |          |
| spaces            | `Space[]`               | Institution spaces                                                |            |          |
| actions           | `Action[]`              | Actions that were triggered in the scope of the institution       |            |          |
| sushiCredentials  | `SushiCredentials[]`    | Institution SUSHI credentials                                     |            |          |
| childInstitutions | `Institution[]`         | Child institutions                                                |            |          |
| repositories      | `Repository[]`          | Institution repositories                                          |            |          |
| repositoryAliases | `RepositoryAlias[]`     | Institution aliases                                               |            |          |
| customProps       | `InstitutionProperty[]` | Custom properties                                                 |            |          |

### InstitutionProperty

| Property    | Type          | Description                                | Attributes | Default |
|-------------|---------------|--------------------------------------------|------------|---------|
| field       | `CustomField` | The custom field                           |            |         |
| institution | `Institution` | The institution                            |            |         |
| createdAt   | `DateTime`    | Creation date                              |            | `now()` |
| updatedAt   | `DateTime`    | Latest update date                         |            |         |
| value       | `Json?`       | The value of the field for the institution |            |         |

### CustomField

| Property              | Type                    | Description                                                                                  | Attributes | Default |
|-----------------------|-------------------------|----------------------------------------------------------------------------------------------|------------|---------|
| id                    | `String`                | ID of the field                                                                              | Id         |         |
| createdAt             | `DateTime`              | Creation date                                                                                |            | `now()` |
| updatedAt             | `DateTime`              | Latest update date                                                                           |            |         |
| multiple              | `Boolean`               | Whether the field should accept multiple values                                              |            | `false` |
| editable              | `Boolean`               | Whether the values of this field can be edited by regular users                              |            | `false` |
| visible               | `Boolean`               | Whether the field should be visible by regular users                                         |            | `false` |
| labelFr               | `String?`               | Field label in French                                                                        |            |         |
| labelEn               | `String?`               | Field label in English                                                                       |            |         |
| descriptionFr         | `String?`               | Field description in French                                                                  |            |         |
| descriptionEn         | `String?`               | Field description in English                                                                 |            |         |
| helpUrl               | `String?`               | URL (if any) to a page containing explanations about that field                              |            |         |
| itemUrl               | `String?`               | URL (if any) to the page dedicated to the institution (use {{id}} to insert the field value) |            |         |
| autocomplete          | `Json?`                 | Source to be used to autocomplete values (format: { index: String, field: String })          |            |         |
| institutionProperties | `InstitutionProperty[]` | Institution properties that reference the field                                              |            |         |

### User

A user

| Property     | Type            | Description                               | Attributes | Default |
|--------------|-----------------|-------------------------------------------|------------|---------|
| username     | `String`        | The username                              | Id         |         |
| fullName     | `String`        | Full name                                 |            |         |
| email        | `String`        | Email                                     |            |         |
| createdAt    | `DateTime`      | Creation date                             |            | `now()` |
| updatedAt    | `DateTime`      | Latest update date                        |            |         |
| isAdmin      | `Boolean`       | Whether the user has admin access or not  |            | `false` |
| metadata     | `Json`          | Arbitrary metadata                        |            | `{}`    |
| memberships  | `Membership[]`  | User memberships                          |            |         |
| elasticRoles | `ElasticRole[]` | User additional roles specific to elastic |            |         |
| actions      | `Action[]`      | Actions that were triggered by the user   |            |         |

### Membership

A membership (a user belonging to an institution)

| Property                   | Type                          | Description                                                                           | Attributes | Default |
|----------------------------|-------------------------------|---------------------------------------------------------------------------------------|------------|---------|
| user                       | `User`                        | The member                                                                            |            |         |
| institution                | `Institution`                 | The institution                                                                       |            |         |
| roles                      | `String[]`                    | Roles of the member inside the institution                                            |            |         |
| permissions                | `String[]`                    | Permissions of the user for the institution (members management, SUSHI, ezREEPORT...) |            |         |
| spacePermissions           | `SpacePermission[]`           | Permissions of the user for the institution spaces                                    |            |         |
| repositoryPermissions      | `RepositoryPermission[]`      | Permissions of the user for the institution repositories                              |            |         |
| repositoryAliasPermissions | `RepositoryAliasPermission[]` | Permissions of the user for the institution aliases                                   |            |         |
| locked                     | `Boolean`                     | Whether the membership can be modified or not by non-admins                           |            | `false` |
| comment                    | `String?`                     | Abritrary comment about the membership                                                |            |         |

### Space

A kibana space

| Property               | Type                           | Description                                                    | Attributes | Default |
|------------------------|--------------------------------|----------------------------------------------------------------|------------|---------|
| id                     | `String`                       | ID of the space (as used in Kibana)                            | Id         |         |
| institution            | `Institution`                  | The institution this space is associated to                    |            |         |
| createdAt              | `DateTime`                     | Creation date (in the DB, not in Kibana)                       |            | `now()` |
| updatedAt              | `DateTime`                     | Latest update date (in the DB, not in Kibana)                  |            |         |
| name                   | `String`                       | Space name                                                     |            |         |
| description            | `String?`                      | Space description                                              |            |         |
| initials               | `String?`                      | Space initials                                                 |            |         |
| color                  | `String?`                      | Space color                                                    |            |         |
| type                   | `String`                       | Space type (ezpaarse, counter5)                                |            |         |
| indexPatterns          | `Json[]`                       | A list of index patterns that should be available in the space |            |         |
| permissions            | `SpacePermission[]`            | Member permissions associated to this space                    |            |         |
| elasticRolePermissions | `ElasticRoleSpacePermission[]` | Permissions granted by role for this space                     |            |         |

### SpacePermission

A space permission (access rights of a member for a specific space)

| Property   | Type         | Description                                           | Attributes | Default |
|------------|--------------|-------------------------------------------------------|------------|---------|
| membership | `Membership` | The member                                            |            |         |
| space      | `Space`      | The space                                             |            |         |
| readonly   | `Boolean`    | Whether the member has a readonly access to the space |            | `false` |
| locked     | `Boolean`    | Whether the permission can be modified or not         |            | `false` |

### Repository

A repository (a section of elasticsearch allocated to an institution)

| Property               | Type                                | Description                                      | Attributes | Default |
|------------------------|-------------------------------------|--------------------------------------------------|------------|---------|
| institutions           | `Institution[]`                     | The institution this repository is associated to |            |         |
| createdAt              | `DateTime`                          | Creation date                                    |            | `now()` |
| updatedAt              | `DateTime`                          | Latest update date                               |            |         |
| pattern                | `String`                            | The index pattern (ex: b-bibcnrs*)               | Id         |         |
| type                   | `String`                            | The repository type (ezpaarse, counter5)         |            |         |
| permissions            | `RepositoryPermission[]`            | Member permissions associated to this repository |            |         |
| aliases                | `RepositoryAlias[]`                 | Aliases associated to this repository            |            |         |
| elasticRolePermissions | `ElasticRoleRepositoryPermission[]` | Permissions granted by role for this repository  |            |         |
| aliasTemplates         | `RepositoryAliasTemplate[]`         | Alias templates that target this repository      |            |         |

### RepositoryPermission

A repository permission (access rights of a member for a specific repository)

| Property   | Type         | Description                                                | Attributes | Default |
|------------|--------------|------------------------------------------------------------|------------|---------|
| membership | `Membership` | The member                                                 |            |         |
| repository | `Repository` | The repository                                             |            |         |
| readonly   | `Boolean`    | Whether the member has a readonly access to the repository |            | `false` |
| locked     | `Boolean`    | Whether the permission can be modified or not              |            | `false` |

### RepositoryAlias

A repository alias (alias for a section of elasticsearch)

| Property               | Type                                     | Description                                                                 | Attributes | Default |
|------------------------|------------------------------------------|-----------------------------------------------------------------------------|------------|---------|
| template               | `RepositoryAliasTemplate?`               | The template of the alias                                                   |            |         |
| institutions           | `Institution[]`                          | The institution this repository is associated to                            |            |         |
| createdAt              | `DateTime`                               | Creation date                                                               |            | `now()` |
| updatedAt              | `DateTime`                               | Latest update date                                                          |            |         |
| pattern                | `String`                                 | The alias pattern (ex: b-bibcnrs)                                           | Id         |         |
| repository             | `Repository`                             | The repository                                                              |            |         |
| filters                | `Json?`                                  | Filters linked to repository (format: [{ "field": "foo", "value": "bar" }]) |            |         |
| permissions            | `RepositoryAliasPermission[]`            | Member permissions associated to this alias                                 |            |         |
| elasticRolePermissions | `ElasticRoleRepositoryAliasPermission[]` | Permissions granted by role for this alias                                  |            |         |

### RepositoryAliasTemplate

A repository alias template (used to generate repository aliases)

| Property   | Type                | Description                                                                        | Attributes | Default |
|------------|---------------------|------------------------------------------------------------------------------------|------------|---------|
| id         | `String`            | ID                                                                                 | Id         |         |
| createdAt  | `DateTime`          | Creation date                                                                      |            | `now()` |
| updatedAt  | `DateTime`          | Latest update date                                                                 |            |         |
| pattern    | `String`            | The alias pattern (ex: x-alias-istex-{id}-ezpaarse)                                |            |         |
| active     | `Boolean`           | Whether the template is active or not                                              |            | `true`  |
| repository | `Repository`        | The repository                                                                     |            |         |
| filters    | `Json[]`            | Filters linked to repository (format: [{ "field": "foo", "value": "bar" }])        |            |         |
| conditions | `Json[]`            | Conditions for creating a new alias (format: [{ "field": "foo", "value": "bar" }]) |            |         |
| aliases    | `RepositoryAlias[]` | The aliases that were generated with this template                                 |            |         |

### RepositoryAliasPermission

A alias permission (access rights of a member for a specific alias)

| Property   | Type              | Description                                   | Attributes | Default |
|------------|-------------------|-----------------------------------------------|------------|---------|
| membership | `Membership`      | The member                                    |            |         |
| alias      | `RepositoryAlias` | The alias                                     |            |         |
| locked     | `Boolean`         | Whether the permission can be modified or not |            | `false` |

### ElasticRole

Custom role to give to users

| Property                   | Type                                     | Description                                            | Attributes | Default |
|----------------------------|------------------------------------------|--------------------------------------------------------|------------|---------|
| name                       | `String`                                 | Name of the role                                       | Id         |         |
| users                      | `User[]`                                 | Users using this roles                                 |            |         |
| institutions               | `Institution[]`                          | Institutions using this roles                          |            |         |
| createdAt                  | `DateTime`                               | Creation date                                          |            | `now()` |
| updatedAt                  | `DateTime`                               | Latest update date                                     |            |         |
| conditions                 | `Json[]`                                 | A list of conditions used to populate the institutions |            |         |
| repositoryPermissions      | `ElasticRoleRepositoryPermission[]`      | Permissions that role give to repositories             |            |         |
| repositoryAliasPermissions | `ElasticRoleRepositoryAliasPermission[]` | Permissions that role gives to repository aliases      |            |         |
| spacePermissions           | `ElasticRoleSpacePermission[]`           | Permissions that role gives to spaces                  |            |         |

### ElasticRoleRepositoryPermission

Permission on repository granted by a role

| Property    | Type          | Description                                                | Attributes | Default |
|-------------|---------------|------------------------------------------------------------|------------|---------|
| elasticRole | `ElasticRole` | The concerned role                                         |            |         |
| repository  | `Repository`  | The concerned repository                                   |            |         |
| readonly    | `Boolean`     | Whether the member has a readonly access to the repository |            | `false` |

### ElasticRoleRepositoryAliasPermission

Permission on repository alias granted by a role

| Property    | Type              | Description         | Attributes | Default |
|-------------|-------------------|---------------------|------------|---------|
| elasticRole | `ElasticRole`     | The concerned role  |            |         |
| alias       | `RepositoryAlias` | The concerned alias |            |         |

### ElasticRoleSpacePermission

Permission on space granted by a role

| Property    | Type          | Description                                           | Attributes | Default |
|-------------|---------------|-------------------------------------------------------|------------|---------|
| elasticRole | `ElasticRole` | The concerned role                                    |            |         |
| space       | `Space`       | The concerned space                                   |            |         |
| readonly    | `Boolean`     | Whether the member has a readonly access to the space |            | `false` |

### Action

Represent the actions that are triggered

| Property    | Type           | Description                                                                   | Attributes | Default  |
|-------------|----------------|-------------------------------------------------------------------------------|------------|----------|
| id          | `String`       | ID of the action                                                              | Id         | `cuid()` |
| institution | `Institution?` |                                                                               |            |          |
| author      | `User?`        | The user that triggered the action                                            |            |          |
| date        | `DateTime`     | When the action occurred                                                      |            | `now()`  |
| type        | `String`       | The action type (ex: commentInstitution, createSpace)                         |            |          |
| data        | `Json`         | Arbitrary data associated with the action (comment message, old/new state...) |            | `{}`     |

### HarvestSession

Represent a harvest session

| Property            | Type           | Description                                                                         | Attributes | Default  |
|---------------------|----------------|-------------------------------------------------------------------------------------|------------|----------|
| id                  | `String`       | ID of the session                                                                   | Id         | `cuid()` |
| beginDate           | `String`       | Beginning of the requested period                                                   |            |          |
| endDate             | `String`       | End of the requested period                                                         |            |          |
| credentialsQuery    | `Json`         | Query to get sushi credentials                                                      |            |          |
| jobs                | `HarvestJob[]` | Jobs created after request                                                          |            |          |
| reportTypes         | `String[]`     | IDs of the requested reports (ex: tr_j1)                                            |            |          |
| timeout             | `Int`          | Maximum execution time of a job                                                     |            | `600`    |
| allowFaulty         | `Boolean`      | Whether the reports should be fetched even if credentials aren't verified or wrong  |            | `false`  |
| downloadUnsupported | `Boolean`      | Whether the reports should be downloaded even if not supported by the endpoint      |            | `false`  |
| forceDownload       | `Boolean`      | Whether the reports should be downloaded even if a local copy already exists        |            | `false`  |
| sendEndMail         | `Boolean`      | Whether a mail should be sent when session ended                                    |            | `true`   |
| ignoreValidation    | `Boolean?`     | Whether the reports should be inserted even if it does not pass the validation step |            |          |
| params              | `Json?`        | Parameters to pass to jobs                                                          |            | `{}`     |
| startedAt           | `DateTime?`    | Start date                                                                          |            |          |
| createdAt           | `DateTime`     | Creation date                                                                       |            | `now()`  |
| updatedAt           | `DateTime`     | Latest update date                                                                  |            |          |

### HarvestJob

Represent the execution of a harvest job

| Property        | Type               | Description                                                                                             | Attributes | Default  |
|-----------------|--------------------|---------------------------------------------------------------------------------------------------------|------------|----------|
| id              | `String`           | ID of the job                                                                                           | Id         | `cuid()` |
| credentials     | `SushiCredentials` | SUSHI credentials used to harvest                                                                       |            |          |
| createdAt       | `DateTime`         | Creation date                                                                                           |            | `now()`  |
| updatedAt       | `DateTime`         | Latest update date                                                                                      |            |          |
| startedAt       | `DateTime?`        | Start date (when the job moved from waiting to running)                                                 |            |          |
| status          | `HarvestJobStatus` | Job status                                                                                              |            |          |
| reportType      | `String`           | ID of the harvested report (ex: tr_j1)                                                                  |            |          |
| session         | `HarvestSession`   | Session that created the job                                                                            |            |          |
| beginDate       | `String`           | Beginning of the requested period, may differ from session's cause of supported periods                 |            |          |
| endDate         | `String`           | End of the requested period, may differ from session's cause of supported periods                       |            |          |
| index           | `String`           | Index where the harvested data should be inserted                                                       |            |          |
| runningTime     | `Int?`             | Job running time                                                                                        |            |          |
| result          | `Json?`            | Job result                                                                                              |            |          |
| errorCode       | `String?`          | Error code, if a fatal exception was encountered                                                        |            |          |
| sushiExceptions | `Json[]`           | SUSHI exceptions returned by the endpoint (format: { code: string, severity: string, message: string }) |            |          |
| logs            | `Log[]`            | Job logs                                                                                                |            |          |
| steps           | `Step[]`           | Job steps                                                                                               |            |          |
| harvests        | `Harvest[]`        | States affected by current job                                                                          |            |          |

### Harvest

Harvest state of a SUSHI item, for a specific month and report ID

| Property        | Type               | Description                                                                                             | Attributes | Default |
|-----------------|--------------------|---------------------------------------------------------------------------------------------------------|------------|---------|
| harvestedAt     | `DateTime`         | Date of the harvest                                                                                     |            | `now()` |
| credentials     | `SushiCredentials` | SUSHI credentials                                                                                       |            |         |
| reportId        | `String`           | Report ID (TR, PR, DR...)                                                                               |            |         |
| period          | `String`           | Report period (format: yyyy-MM)                                                                         |            |         |
| status          | `String`           | Status of the harvest (waiting, running, finished, failed...)                                           |            |         |
| errorCode       | `String?`          | Error code, if a fatal exception was encountered                                                        |            |         |
| sushiExceptions | `Json[]`           | SUSHI exceptions returned by the endpoint (format: { code: string, severity: string, message: string }) |            |         |
| insertedItems   | `Int`              | Number of report items that were successfuly inserted into Elasticsearch                                |            | `0`     |
| updatedItems    | `Int`              | Number of report items that were updated in Elasticsearch                                               |            | `0`     |
| failedItems     | `Int`              | Number of report items that failed to be inserted into Elasticsearch                                    |            | `0`     |
| harvestedBy     | `HarvestJob?`      | Job that harvested current state                                                                        |            |         |

### Log

A job log

| Property | Type         | Description                   | Attributes | Default  |
|----------|--------------|-------------------------------|------------|----------|
| id       | `String`     | ID of the log                 | Id         | `cuid()` |
| job      | `HarvestJob` | The job that produced the log |            |          |
| date     | `DateTime`   | Date of the log               |            | `now()`  |
| level    | `String`     | Level of the log              |            |          |
| message  | `String`     | Message of the log            |            |          |

### Step

A job step

| Property    | Type         | Description                         | Attributes | Default  |
|-------------|--------------|-------------------------------------|------------|----------|
| id          | `String`     | ID of the step                      | Id         | `cuid()` |
| job         | `HarvestJob` | The job that the step is part of    |            |          |
| createdAt   | `DateTime`   | Creation date                       |            | `now()`  |
| updatedAt   | `DateTime`   | Latest update date                  |            |          |
| startedAt   | `DateTime`   | Start date                          |            |          |
| label       | `String`     | Step label                          |            |          |
| status      | `String`     | Step status                         |            |          |
| runningTime | `Int`        | Running time                        |            |          |
| data        | `Json`       | Arbitrary data produced by the step |            |          |

### SushiEndpoint

A SUSHI endpoint

| Property                  | Type                 | Description                                                                                                    | Attributes | Default  |
|---------------------------|----------------------|----------------------------------------------------------------------------------------------------------------|------------|----------|
| id                        | `String`             | ID of the endpoint                                                                                             | Id         | `cuid()` |
| createdAt                 | `DateTime`           | Creation date                                                                                                  |            | `now()`  |
| updatedAt                 | `DateTime`           | Latest update date                                                                                             |            |          |
| sushiUrl                  | `String`             | Base URL of the SUSHI service                                                                                  |            |          |
| vendor                    | `String`             | Vendor name of the endpoint                                                                                    |            |          |
| tags                      | `String[]`           | Abritrary tag list associated to the endpoint                                                                  |            |          |
| description               | `String?`            | Description of the endpoint                                                                                    |            |          |
| counterVersions           | `String[]`           | Counter versions of the SUSHI service                                                                          |            |          |
| technicalProvider         | `String?`            | Technical provider of the endpoint (ex: Atypon)                                                                |            |          |
| active                    | `Boolean`            | Whether the endpoint is active and can be harvested                                                            |            | `true`   |
| activeUpdatedAt           | `DateTime`           | Date on which the active status was last modified                                                              |            | `now()`  |
| requireCustomerId         | `Boolean`            | Whether the endpoint requires a customer ID                                                                    |            | `false`  |
| requireRequestorId        | `Boolean`            | Whether the endpoint requires a requestor ID                                                                   |            | `false`  |
| requireApiKey             | `Boolean`            | Whether the endpoint requires an API key                                                                       |            | `false`  |
| ignoreReportValidation    | `Boolean`            | Whether report validation errors should be ignored                                                             |            | `false`  |
| disabledUntil             | `DateTime?`          | Date until which the endpoint is disabled (no harvest allowed)                                                 |            |          |
| defaultCustomerId         | `String?`            | Default value for the customer_id parameter                                                                    |            |          |
| defaultRequestorId        | `String?`            | Default value for the requestor_id parameter                                                                   |            |          |
| defaultApiKey             | `String?`            | Default value for the api_key parameter                                                                        |            |          |
| paramSeparator            | `String?`            | Separator used for multivaluated sushi params like Attributes_To_Show (defaults to "|")                        |            |          |
| supportedReports          | `String[]`           | [Deprecated] List report IDs that are supported by the endpoint                                                |            |          |
| ignoredReports            | `String[]`           | [Deprecated] List of report IDs that should be ignored, even if the endpoint indicates that they are supported |            |          |
| additionalReports         | `String[]`           | [Deprecated] Additional report IDs to be added to the list of supported reports provided by the endpoint       |            |          |
| supportedReportsUpdatedAt | `DateTime?`          | [Deprecated] Date on which the list of supported reports was last updated                                      |            |          |
| supportedData             | `Json`               | List of reports that are supported (or unsupported) by the endpoint, with periods available                    |            | `{}`     |
| supportedDataUpdatedAt    | `DateTime?`          | Date on which the list of supported data was last updated                                                      |            |          |
| harvestDateFormat         | `String?`            | Date format to use for the begin_date and end_date parameters (defaults to "yyyy-MM")                          |            |          |
| testedReport              | `String?`            | Report used when testing endpoint                                                                              |            |          |
| registryId                | `String?`            | Id of platform in https://registry.countermetrics.org                                                          |            |          |
| credentials               | `SushiCredentials[]` | SUSHI credentials associated with the endpoint                                                                 |            |          |
| params                    | `Json[]`             | Additionnal default parameters. Each param has a name, a value, and a scope.                                   |            |          |

### SushiCredentials

A set of SUSHI credentials, associated to a SUSHI endpoint

| Property          | Type                            | Description                                                                                              | Attributes | Default  |
|-------------------|---------------------------------|----------------------------------------------------------------------------------------------------------|------------|----------|
| id                | `String`                        | ID of the SUSHI credentials                                                                              | Id         | `cuid()` |
| createdAt         | `DateTime`                      | Creation date                                                                                            |            | `now()`  |
| updatedAt         | `DateTime`                      | Latest update date                                                                                       |            |          |
| deletedAt         | `DateTime?`                     | When item was marked for deletion                                                                        |            |          |
| customerId        | `String?`                       | Value of the customer_id parameter                                                                       |            |          |
| requestorId       | `String?`                       | Value of the requestor_id parameter                                                                      |            |          |
| apiKey            | `String?`                       | Value of the api_key parameter                                                                           |            |          |
| comment           | `String?`                       | Abritrary comment about the credentials                                                                  |            |          |
| active            | `Boolean`                       | Whether the credentials are active and can be harvested                                                  |            | `true`   |
| activeUpdatedAt   | `DateTime`                      | Date on which the active status was last modified                                                        |            | `now()`  |
| archived          | `Boolean`                       | Whether the credentials are archived                                                                     |            | `false`  |
| archivedUpdatedAt | `DateTime`                      | Date on which the archived status was last modified                                                      |            | `now()`  |
| packages          | `String[]`                      | Packages (profiles, accounts, funds...) that include the credentials                                     |            |          |
| tags              | `String[]`                      | Abritrary tag list associated to the credentials                                                         |            |          |
| params            | `Json[]`                        | Additionnal parameters. Each param has a name, a value, and a scope.                                     |            |          |
| institution       | `Institution`                   | Institution that owns the credentials                                                                    |            |          |
| endpoint          | `SushiEndpoint`                 | The SUSHI endpoint                                                                                       |            |          |
| harvestJobs       | `HarvestJob[]`                  | The harvest jobs associated to the credentials                                                           |            |          |
| harvests          | `Harvest[]`                     | The harvest states associated to the credentials                                                         |            |          |
| deletionTask      | `SushiCredentialsDeletionTask?` | The deletion task associated to the credentials                                                          |            |          |
| connection        | `Json?`                         | Last connection test. Format: { date: DateTime, status: String, exceptions: Json[], errorCode: String? } |            |          |

### SushiCredentialsDeletionTask

| Property     | Type                 | Description                       | Attributes | Default |
|--------------|----------------------|-----------------------------------|------------|---------|
| id           | `String`             | ID of the Elastic task            | Id         |         |
| progress     | `Int`                | Progress of the task              |            | `0`     |
| indexPattern | `String`             | Index pattern related to the task |            |         |
| canceled     | `Boolean`            | Is the task canceled              |            | `false` |
| error        | `String?`            | Error encountered with the task   |            |         |
| createdAt    | `DateTime`           | Creation date                     |            | `now()` |
| updatedAt    | `DateTime`           | Latest update date                |            |         |
| credentials  | `SushiCredentials[]` | Credentials related to task       |            |         |
