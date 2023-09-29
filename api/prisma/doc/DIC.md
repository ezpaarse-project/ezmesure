# ezMESURE

## Models

### Institution

| Property          | Type                 | Description | Attributes | Default  |
|-------------------|----------------------|-------------|------------|----------|
| id                | `String`             |             | Id         | `cuid()` |
| parentInstitution | `Institution?`       |             |            |          |
| createdAt         | `DateTime`           |             |            | `now()`  |
| updatedAt         | `DateTime`           |             |            |          |
| name              | `String`             |             |            |          |
| namespace         | `String?`            |             |            |          |
| validated         | `Boolean`            |             |            | `false`  |
| hidePartner       | `Boolean`            |             |            | `false`  |
| tags              | `String[]`           |             |            |          |
| logoId            | `String?`            |             |            |          |
| type              | `String?`            |             |            |          |
| acronym           | `String?`            |             |            |          |
| websiteUrl        | `String?`            |             |            |          |
| city              | `String?`            |             |            |          |
| uai               | `String?`            |             |            |          |
| social            | `Json?`              |             |            |          |
| auto              | `Json?`              |             |            |          |
| sushiReadySince   | `DateTime?`          |             |            |          |
| memberships       | `Membership[]`       |             |            |          |
| spaces            | `Space[]`            |             |            |          |
| historyEntries    | `HistoryEntry[]`     |             |            |          |
| sushiCredentials  | `SushiCredentials[]` |             |            |          |
| childInstitutions | `Institution[]`      |             |            |          |
| repositories      | `Repository[]`       |             |            |          |

### User

| Property       | Type             | Description | Attributes | Default |
|----------------|------------------|-------------|------------|---------|
| username       | `String`         |             | Id         |         |
| fullName       | `String`         |             |            |         |
| email          | `String`         |             |            |         |
| createdAt      | `DateTime`       |             |            | `now()` |
| updatedAt      | `DateTime`       |             |            |         |
| isAdmin        | `Boolean`        |             |            | `false` |
| metadata       | `Json`           |             |            | `{}`    |
| memberships    | `Membership[]`   |             |            |         |
| historyEntries | `HistoryEntry[]` |             |            |         |

### Membership

| Property              | Type                     | Description | Attributes | Default |
|-----------------------|--------------------------|-------------|------------|---------|
| user                  | `User`                   |             |            |         |
| institution           | `Institution`            |             |            |         |
| roles                 | `String[]`               |             |            |         |
| permissions           | `String[]`               |             |            |         |
| spacePermissions      | `SpacePermission[]`      |             |            |         |
| repositoryPermissions | `RepositoryPermission[]` |             |            |         |
| locked                | `Boolean`                |             |            | `false` |

### Space

| Property      | Type                | Description | Attributes | Default |
|---------------|---------------------|-------------|------------|---------|
| id            | `String`            |             | Id         |         |
| institution   | `Institution?`      |             |            |         |
| createdAt     | `DateTime`          |             |            | `now()` |
| updatedAt     | `DateTime`          |             |            |         |
| name          | `String`            |             |            |         |
| description   | `String?`           |             |            |         |
| initials      | `String?`           |             |            |         |
| color         | `String?`           |             |            |         |
| type          | `String`            |             |            |         |
| indexPatterns | `Json[]`            |             |            |         |
| permissions   | `SpacePermission[]` |             |            |         |

### SpacePermission

| Property   | Type         | Description | Attributes | Default |
|------------|--------------|-------------|------------|---------|
| membership | `Membership` |             |            |         |
| space      | `Space`      |             |            |         |
| readonly   | `Boolean`    |             |            | `false` |
| locked     | `Boolean`    |             |            | `false` |

### Repository

| Property    | Type                     | Description | Attributes | Default  |
|-------------|--------------------------|-------------|------------|----------|
| id          | `String`                 |             | Id         | `cuid()` |
| institution | `Institution?`           |             |            |          |
| createdAt   | `DateTime`               |             |            | `now()`  |
| updatedAt   | `DateTime`               |             |            |          |
| pattern     | `String`                 |             |            |          |
| type        | `String`                 |             |            |          |
| permissions | `RepositoryPermission[]` |             |            |          |

### RepositoryPermission

| Property   | Type         | Description | Attributes | Default |
|------------|--------------|-------------|------------|---------|
| membership | `Membership` |             |            |         |
| repository | `Repository` |             |            |         |
| readonly   | `Boolean`    |             |            | `false` |
| locked     | `Boolean`    |             |            | `false` |

### HistoryEntry

| Property    | Type          | Description | Attributes | Default  |
|-------------|---------------|-------------|------------|----------|
| id          | `String`      |             | Id         | `cuid()` |
| institution | `Institution` |             |            |          |
| author      | `User`        |             |            |          |
| createdAt   | `DateTime`    |             |            | `now()`  |
| updatedAt   | `DateTime`    |             |            |          |
| type        | `String`      |             |            |          |
| message     | `String?`     |             |            |          |
| data        | `Json`        |             |            |          |

### HarvestJob

| Property         | Type               | Description                                                                                             | Attributes | Default  |
|------------------|--------------------|---------------------------------------------------------------------------------------------------------|------------|----------|
| id               | `String`           |                                                                                                         | Id         | `cuid()` |
| credentials      | `SushiCredentials` |                                                                                                         |            |          |
| createdAt        | `DateTime`         |                                                                                                         |            | `now()`  |
| updatedAt        | `DateTime`         |                                                                                                         |            |          |
| startedAt        | `DateTime?`        |                                                                                                         |            |          |
| beginDate        | `String`           |                                                                                                         |            |          |
| endDate          | `String`           |                                                                                                         |            |          |
| status           | `String`           |                                                                                                         |            |          |
| reportType       | `String`           |                                                                                                         |            |          |
| harvestId        | `String`           |                                                                                                         |            |          |
| index            | `String`           |                                                                                                         |            |          |
| runningTime      | `Int?`             |                                                                                                         |            |          |
| timeout          | `Int`              |                                                                                                         |            |          |
| forceDownload    | `Boolean`          |                                                                                                         |            | `false`  |
| ignoreValidation | `Boolean`          |                                                                                                         |            | `false`  |
| params           | `Json?`            |                                                                                                         |            | `{}`     |
| result           | `Json?`            |                                                                                                         |            |          |
| errorCode        | `String?`          | Error code, if a fatal exception was encountered                                                        |            |          |
| sushiExceptions  | `Json[]`           | SUSHI exceptions returned by the endpoint (format: { code: string, severity: string, message: string }) |            |          |
| logs             | `Log[]`            |                                                                                                         |            |          |
| steps            | `Step[]`           |                                                                                                         |            |          |

### Harvest

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

### Log

| Property | Type         | Description | Attributes | Default  |
|----------|--------------|-------------|------------|----------|
| id       | `String`     |             | Id         | `cuid()` |
| job      | `HarvestJob` |             |            |          |
| date     | `DateTime`   |             |            | `now()`  |
| level    | `String`     |             |            |          |
| message  | `String`     |             |            |          |

### Step

| Property    | Type         | Description | Attributes | Default  |
|-------------|--------------|-------------|------------|----------|
| id          | `String`     |             | Id         | `cuid()` |
| job         | `HarvestJob` |             |            |          |
| createdAt   | `DateTime`   |             |            | `now()`  |
| updatedAt   | `DateTime`   |             |            |          |
| startedAt   | `DateTime`   |             |            |          |
| label       | `String`     |             |            |          |
| status      | `String`     |             |            |          |
| runningTime | `Int`        |             |            |          |
| data        | `Json`       |             |            |          |

### SushiEndpoint

| Property                  | Type                 | Description | Attributes | Default  |
|---------------------------|----------------------|-------------|------------|----------|
| id                        | `String`             |             | Id         | `cuid()` |
| createdAt                 | `DateTime`           |             |            | `now()`  |
| updatedAt                 | `DateTime`           |             |            |          |
| sushiUrl                  | `String`             |             |            |          |
| vendor                    | `String`             |             |            |          |
| tags                      | `String[]`           |             |            |          |
| description               | `String?`            |             |            |          |
| counterVersion            | `String?`            |             |            |          |
| technicalProvider         | `String?`            |             |            |          |
| requireCustomerId         | `Boolean`            |             |            | `false`  |
| requireRequestorId        | `Boolean`            |             |            | `false`  |
| requireApiKey             | `Boolean`            |             |            | `false`  |
| ignoreReportValidation    | `Boolean`            |             |            | `false`  |
| disabledUntil             | `DateTime?`          |             |            |          |
| defaultCustomerId         | `String?`            |             |            |          |
| defaultRequestorId        | `String?`            |             |            |          |
| defaultApiKey             | `String?`            |             |            |          |
| paramSeparator            | `String?`            |             |            |          |
| supportedReports          | `String[]`           |             |            |          |
| supportedReportsUpdatedAt | `DateTime?`          |             |            |          |
| credentials               | `SushiCredentials[]` |             |            |          |
| params                    | `Json[]`             |             |            |          |

### SushiCredentials

| Property    | Type            | Description | Attributes | Default  |
|-------------|-----------------|-------------|------------|----------|
| id          | `String`        |             | Id         | `cuid()` |
| createdAt   | `DateTime`      |             |            | `now()`  |
| updatedAt   | `DateTime`      |             |            |          |
| customerId  | `String?`       |             |            |          |
| requestorId | `String?`       |             |            |          |
| apiKey      | `String?`       |             |            |          |
| comment     | `String?`       |             |            |          |
| tags        | `String[]`      |             |            |          |
| params      | `Json[]`        |             |            |          |
| institution | `Institution`   |             |            |          |
| endpoint    | `SushiEndpoint` |             |            |          |
| harvestJobs | `HarvestJob[]`  |             |            |          |
| harvests    | `Harvest[]`     |             |            |          |
