# ezMESURE


## Models

### Institution

| Property            | Type               | Description | Attributes |
|---------------------|--------------------|-------------|------------|
| id                  | String             |             | Id         |
| parentInstitutionId | String             |             | Readonly   |
| parentInstitution   | Institution        |             |            |
| createdAt           | DateTime           |             |            |
| updatedAt           | DateTime           |             |            |
| name                | String             |             |            |
| validated           | Boolean            |             |            |
| hidePartner         | Boolean            |             |            |
| tags                | String[]           |             |            |
| logoId              | String             |             |            |
| type                | String             |             |            |
| acronym             | String             |             |            |
| websiteUrl          | String             |             |            |
| city                | String             |             |            |
| uai                 | String             |             |            |
| social              | Json               |             |            |
| auto                | Json               |             |            |
| sushiReadySince     | DateTime           |             |            |
| memberships         | Membership[]       |             |            |
| spaces              | Space[]            |             |            |
| historyEntries      | HistoryEntry[]     |             |            |
| sushiCredentials    | SushiCredentials[] |             |            |
| childInstitutions   | Institution[]      |             |            |
| repositories        | Repository[]       |             |            |

### User

| Property       | Type           | Description | Attributes |
|----------------|----------------|-------------|------------|
| username       | String         |             | Id         |
| fullName       | String         |             |            |
| email          | String         |             |            |
| createdAt      | DateTime       |             |            |
| updatedAt      | DateTime       |             |            |
| isAdmin        | Boolean        |             |            |
| metadata       | Json           |             |            |
| memberships    | Membership[]   |             |            |
| historyEntries | HistoryEntry[] |             |            |

### Membership

| Property              | Type                   | Description | Attributes |
|-----------------------|------------------------|-------------|------------|
| username              | String                 |             | Readonly   |
| user                  | User                   |             |            |
| institutionId         | String                 |             | Readonly   |
| institution           | Institution            |             |            |
| roles                 | String[]               |             |            |
| permissions           | String[]               |             |            |
| spacePermissions      | SpacePermission[]      |             |            |
| repositoryPermissions | RepositoryPermission[] |             |            |
| locked                | Boolean                |             |            |

### Space

| Property         | Type              | Description | Attributes |
|------------------|-------------------|-------------|------------|
| id               | String            |             | Id         |
| institutionId    | String            |             | Readonly   |
| institution      | Institution       |             |            |
| createdAt        | DateTime          |             |            |
| updatedAt        | DateTime          |             |            |
| type             | String            |             |            |
| spacePermissions | SpacePermission[] |             |            |

### SpacePermission

| Property      | Type       | Description | Attributes |
|---------------|------------|-------------|------------|
| username      | String     |             | Readonly   |
| institutionId | String     |             | Readonly   |
| membership    | Membership |             |            |
| spaceId       | String     |             | Readonly   |
| space         | Space      |             |            |
| readonly      | Boolean    |             |            |
| locked        | Boolean    |             |            |

### Repository

| Property      | Type                   | Description | Attributes |
|---------------|------------------------|-------------|------------|
| id            | String                 |             | Id         |
| institutionId | String                 |             | Readonly   |
| institution   | Institution            |             |            |
| createdAt     | DateTime               |             |            |
| updatedAt     | DateTime               |             |            |
| pattern       | String                 |             |            |
| type          | String                 |             |            |
| permissions   | RepositoryPermission[] |             |            |

### RepositoryPermission

| Property      | Type       | Description | Attributes |
|---------------|------------|-------------|------------|
| username      | String     |             | Readonly   |
| institutionId | String     |             | Readonly   |
| membership    | Membership |             |            |
| repositoryId  | String     |             | Readonly   |
| repository    | Repository |             |            |
| readonly      | Boolean    |             |            |
| locked        | Boolean    |             |            |

### HistoryEntry

| Property      | Type        | Description | Attributes |
|---------------|-------------|-------------|------------|
| id            | String      |             | Id         |
| institutionId | String      |             | Readonly   |
| institution   | Institution |             |            |
| authorId      | String      |             | Readonly   |
| author        | User        |             |            |
| createdAt     | DateTime    |             |            |
| updatedAt     | DateTime    |             |            |
| type          | String      |             |            |
| message       | String      |             |            |
| data          | Json        |             |            |

### HarvestJob

| Property    | Type           | Description | Attributes |
|-------------|----------------|-------------|------------|
| id          | String         |             | Id         |
| requestId   | String         |             | Readonly   |
| requests    | HarvestRequest |             |            |
| createdAt   | DateTime       |             |            |
| updatedAt   | DateTime       |             |            |
| status      | String         |             |            |
| params      | Json           |             |            |
| runningTime | Int            |             |            |
| result      | Json           |             |            |
| logs        | Log[]          |             |            |
| steps       | Step[]         |             |            |

### HarvestRequest

| Property      | Type             | Description | Attributes |
|---------------|------------------|-------------|------------|
| id            | String           |             | Id         |
| credentialsId | String           |             | Readonly   |
| credentials   | SushiCredentials |             |            |
| reportId      | String           |             |            |
| HarvestJob    | HarvestJob[]     |             |            |

### Log

| Property | Type       | Description | Attributes |
|----------|------------|-------------|------------|
| id       | String     |             | Id         |
| jobId    | String     |             | Readonly   |
| job      | HarvestJob |             |            |
| date     | DateTime   |             |            |
| level    | String     |             |            |
| message  | String     |             |            |

### Step

| Property    | Type       | Description | Attributes |
|-------------|------------|-------------|------------|
| id          | String     |             | Id         |
| jobId       | String     |             | Readonly   |
| job         | HarvestJob |             |            |
| createdAt   | DateTime   |             |            |
| updatedAt   | DateTime   |             |            |
| startedAt   | DateTime   |             |            |
| label       | String     |             |            |
| status      | String     |             |            |
| runningTime | Int        |             |            |
| data        | Json       |             |            |

### SushiEndpoint

| Property               | Type               | Description | Attributes |
|------------------------|--------------------|-------------|------------|
| id                     | String             |             | Id         |
| createdAt              | DateTime           |             |            |
| updatedAt              | DateTime           |             |            |
| sushiUrl               | String             |             |            |
| vendor                 | String             |             |            |
| tags                   | String[]           |             |            |
| description            | String             |             |            |
| counterVersion         | String             |             |            |
| technicalProvider      | String             |             |            |
| requireCustomerId      | Boolean            |             |            |
| requireRequestorId     | Boolean            |             |            |
| requireApiKey          | Boolean            |             |            |
| ignoreReportValidation | Boolean            |             |            |
| defaultCustomerId      | String             |             |            |
| defaultRequestorId     | String             |             |            |
| defaultApiKey          | String             |             |            |
| paramSeparator         | String             |             |            |
| supportedReports       | String[]           |             |            |
| credentials            | SushiCredentials[] |             |            |
| params                 | Json[]             |             |            |

### SushiCredentials

| Property        | Type             | Description | Attributes |
|-----------------|------------------|-------------|------------|
| id              | String           |             | Id         |
| createdAt       | DateTime         |             |            |
| updatedAt       | DateTime         |             |            |
| institutionId   | String           |             | Readonly   |
| endpointId      | String           |             | Readonly   |
| customerId      | String           |             |            |
| requestorId     | String           |             |            |
| apiKey          | String           |             |            |
| comment         | String           |             |            |
| tags            | String[]         |             |            |
| params          | Json[]           |             |            |
| institution     | Institution      |             |            |
| endpoint        | SushiEndpoint    |             |            |
| harvestRequests | HarvestRequest[] |             |            |
