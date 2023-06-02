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
| validated         | `Boolean`            |             |            |          |
| hidePartner       | `Boolean`            |             |            |          |
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
| isAdmin        | `Boolean`        |             |            |         |
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
| locked                | `Boolean`                |             |            |         |

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
| readonly   | `Boolean`    |             |            |         |
| locked     | `Boolean`    |             |            |         |

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
| readonly   | `Boolean`    |             |            |         |
| locked     | `Boolean`    |             |            |         |

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

| Property    | Type             | Description | Attributes | Default  |
|-------------|------------------|-------------|------------|----------|
| id          | `String`         |             | Id         | `cuid()` |
| requests    | `HarvestRequest` |             |            |          |
| createdAt   | `DateTime`       |             |            | `now()`  |
| updatedAt   | `DateTime`       |             |            |          |
| status      | `String`         |             |            |          |
| params      | `Json`           |             |            |          |
| runningTime | `Int`            |             |            |          |
| result      | `Json`           |             |            |          |
| logs        | `Log[]`          |             |            |          |
| steps       | `Step[]`         |             |            |          |

### HarvestRequest

| Property    | Type               | Description | Attributes | Default  |
|-------------|--------------------|-------------|------------|----------|
| id          | `String`           |             | Id         | `cuid()` |
| credentials | `SushiCredentials` |             |            |          |
| reportId    | `String`           |             |            |          |
| HarvestJob  | `HarvestJob[]`     |             |            |          |

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

| Property               | Type                 | Description | Attributes | Default  |
|------------------------|----------------------|-------------|------------|----------|
| id                     | `String`             |             | Id         | `cuid()` |
| createdAt              | `DateTime`           |             |            | `now()`  |
| updatedAt              | `DateTime`           |             |            |          |
| sushiUrl               | `String`             |             |            |          |
| vendor                 | `String`             |             |            |          |
| tags                   | `String[]`           |             |            |          |
| description            | `String?`            |             |            |          |
| counterVersion         | `String?`            |             |            |          |
| technicalProvider      | `String?`            |             |            |          |
| requireCustomerId      | `Boolean`            |             |            |          |
| requireRequestorId     | `Boolean`            |             |            |          |
| requireApiKey          | `Boolean`            |             |            |          |
| ignoreReportValidation | `Boolean`            |             |            |          |
| defaultCustomerId      | `String?`            |             |            |          |
| defaultRequestorId     | `String?`            |             |            |          |
| defaultApiKey          | `String?`            |             |            |          |
| paramSeparator         | `String?`            |             |            |          |
| supportedReports       | `String[]`           |             |            |          |
| credentials            | `SushiCredentials[]` |             |            |          |
| params                 | `Json[]`             |             |            |          |

### SushiCredentials

| Property        | Type               | Description | Attributes | Default  |
|-----------------|--------------------|-------------|------------|----------|
| id              | `String`           |             | Id         | `cuid()` |
| createdAt       | `DateTime`         |             |            | `now()`  |
| updatedAt       | `DateTime`         |             |            |          |
| customerId      | `String?`          |             |            |          |
| requestorId     | `String?`          |             |            |          |
| apiKey          | `String?`          |             |            |          |
| comment         | `String?`          |             |            |          |
| tags            | `String[]`         |             |            |          |
| params          | `Json[]`           |             |            |          |
| institution     | `Institution`      |             |            |          |
| endpoint        | `SushiEndpoint`    |             |            |          |
| harvestRequests | `HarvestRequest[]` |             |            |          |
