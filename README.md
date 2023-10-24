# CDS-TS Dispatcher

<img src="https://img.shields.io/badge/SAP-0FAAFF?style=for-the-badge&logo=sap&logoColor=white" /> <img src="https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white" /> <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" /> <img src="https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white" /> <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" />

The goal of CDS-TS-Dispatcher is to significantly reduce the boilerplate code required to implement TS handlers provided by the SAP CAP framework.

<a name="readme-top"></a>

## Table of Contents

- [CDS-TS Dispatcher](#cds-ts-dispatcher)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Install CDS-TS-Dispatcher - New project](#install-cds-ts-dispatcher---new-project)
    - [Install CDS-TS-Dispatcher - Existing project](#install-cds-ts-dispatcher---existing-project)
    - [Generate CDS Typed entities](#generate-cds-typed-entities)
  - [Architecture](#architecture)
  - [`[Optional]` - BaseRepository](#optional---baserepository)
  - [Usage](#usage)
    - [CDSDispatcher](#cdsdispatcher)
    - [Decorators](#decorators)
      - [Class](#class)
        - [EntityHandler](#entityhandler)
        - [ServiceLogic](#servicelogic)
        - [Repository](#repository)
          - [Optional BaseRepository](#optional-baserepository)
        - [UnboundActions](#unboundactions)
      - [Fields](#fields)
        - [Inject](#inject)
        - [Inject SRV](#inject-srv)
      - [Methods](#methods)
        - [Before](#before)
          - [BeforeCreate](#beforecreate)
          - [BeforeRead](#beforeread)
          - [BeforeUpdate](#beforeupdate)
          - [BeforeDelete](#beforedelete)
        - [After](#after)
          - [AfterCreate](#aftercreate)
          - [AfterRead](#afterread)
          - [AfterUpdate](#afterupdate)
          - [AfterDelete](#afterdelete)
        - [On](#on)
          - [OnCreate](#oncreate)
          - [OnRead](#onread)
          - [OnUpdate](#onupdate)
          - [OnDelete](#ondelete)
          - [OnAction](#onaction)
          - [OnFunction](#onfunction)
          - [OnBoundAction](#onboundaction)
          - [OnBoundFunction](#onboundfunction)
        - [Fiori draft](#fiori-draft)
          - [Draft](#draft)
          - [OnNewDraft](#onnewdraft)
          - [OnCancelDraft](#oncanceldraft)
          - [OnEditDraft](#oneditdraft)
          - [OnSaveDraft](#onsavedraft)
        - [SingleInstanceCapable](#singleinstancecapable)
          - [Usage](#usage-1)
  - [Examples](#examples)
  - [Contributing](#contributing)
  - [License](#license)
  - [Authors](#authors)

## Prerequisites

Install [**@sap/cds-dk**](https://cap.cloud.sap/docs/get-started/) globally:

```bash
npm i -g @sap/cds-dk
```

## Installation

### Install CDS-TS-Dispatcher - New project

Use the following steps if you want to create a new **SAP CAP project.**

1. Create new folder :

```bash
mkdir new-sap-cap-project
cd new-sap-cap-project
```

2. Initialize the CDS folder structure :

```bash
cds init
```

1. Add the the following NPM packages :

```bash
npm install @sap/cds express
npm install --save-dev @dxfrontier/cds-ts-dispatcher @types/node @cap-js/sqlite typescript
```

4. Add a **tsconfig.json** :

```bash
tsc --init
```

5. It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

6. Run the `CDS-TS` server

```bash
cds-ts watch
```

### Install CDS-TS-Dispatcher - Existing project

Use the following steps if you want to add only the **@dxfrontier/cds-ts-dispatcher to an existing project :**

```bash
npm install @dxfrontier/cds-ts-dispatcher
```

It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Generate CDS Typed entities

The following command should be used to generate the typed entities.

```bash
npx @cap-js/cds-typer "*" --outputDirectory ./srv/util/types/entities
```

- Target folder :`./srv/util/types/entities` - Change to your location destination folder.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

**We recommend adhering** to the **Controller-Service-Repository** design pattern using the following folder structure:

1. [EntityHandler](#entityhandler) `(Controller)` - Responsible for managing the REST interface to the business logic implemented in [ServiceLogic](#servicelogic)
2. [ServiceLogic](#servicelogic) `(Service)` - Contains business logic implementations
3. [Repository](#repository) `(Repository)` - This component is dedicated to handling entity manipulation operations by leveraging the power of [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql).

`Controller-Service-Repository` suggested folder structure

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure.png?raw=true) <= expanded folders => ![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure_expanded.png?raw=true)

## `[Optional]` - BaseRepository

Simplify Entity Manipulation with CDS-QL: [BaseRepository](https://github.com/dxfrontier/cds-ts-repository)

It offers a simplified interface for common database actions such as `create(), createMany(), getAll(), find(), update(), updateLocaleTexts(), getLocaleTexts(), count(), exists(), delete(), deleteMany() ... ` and many other actions.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### CDSDispatcher

**CDSDispatcher**(`entities` : `Constructable[]`)

The `CDSDispatcher` constructor allows you to create an instance for dispatching and managing entities.

`CDSDispatcher` class will initialize all **[Entity handler](#entityhandler)(s)** and all of their `Dependencies` : [Services](#servicelogic), [Repositories](#repository).

`Parameters`

- `entities (Array)`: An array of **[Entity handler](#entityhandler)(s)** (Constructable) that represent the different types of entities in the CDS.

`Example`

```typescript
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';

module.exports = new CDSDispatcher([BookHandler, ReviewHandler, UnboundActionsHandler, ...]).initialize();
```

`Visual image`

<img src="https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/usage_cdsDispatcher.png?raw=true">

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Decorators

#### Class

##### EntityHandler

**@EntityHandler**(`entity`: CDSTyperEntity)

The `@EntityHandler` decorator is utilized at the `class-level` to annotate a class with the specific `entity` that will be used in all handlers.

`Parameters`

- `entity (CDSTyperEntity)`: A specialized class generated using the [CDS-Typer](#generate-cds-typed-entities).

`Example`

```typescript
import { EntityHandler } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
class CustomerHandler {
  ...
  constructor() {}
  ...
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### ServiceLogic

**@ServiceLogic()**

The `@ServiceLogic` decorator is utilized at the `class-level` to annotate a `class` as a specialized class containing only business logic.

When applying `ServiceLogic` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

`Example`

```typescript
import { ServiceLogic } from '@dxfrontier/cds-ts-dispatcher';

@ServiceLogic()
class CustomerService {
  ...
  constructor() {}
  ...
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Repository

**@Repository()**

The `@Repository` decorator is utilized as a `class-level` annotation that designates a particular `class` as a specialized `Repository`.

When applying `Repository` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

```typescript
import { Repository } from '@dxfrontier/cds-ts-dispatcher';

@Repository()
class CustomerRepository {
  ...
  constructor() {}
  ...
```

###### Optional BaseRepository

The **[CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql)** **[BaseRepository](https://github.com/dxfrontier/cds-ts-repository)** was designed to reduce the boilerplate code required to implement data access layer for persistance entities.

It simplifies the implementation by offering a set of ready-to-use actions for interacting with the database. These actions include:

- `.create()`: Create new records in the database.
- `.findAll()`: Retrieve all records from the database.
- `.find()`: Query the database to find specific data.
- `.delete()`: Remove records from the database.
- `.exists()`: Check the existence of data in the database.
- ... and many other actions

To get started, refer to the official documentation **[BaseRepository](https://github.com/dxfrontier/cds-ts-repository)**. Explore the capabilities it offers and enhance your data access layer with ease.

`Example`

```typescript
import { Repository } from '@dxfrontier/cds-ts-dispatcher';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@Repository()
class CustomerRepository extends BaseRepository<MyEntity> {
  constructor() {
    super(MyEntity);
  }

  public async aMethod() {
    const created = this.create(...)
    const createdMany = this.createMany(...)
    const updated = this.update(...)
    // ...
  }
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### UnboundActions

**@UnboundActions()**

The `@UnboundActions` decorator is utilized at the `class-level` to annotate a `class` as a specialized class which will be used only for Unbound actions.

`Example`

```typescript
import { UnboundActions } from '@dxfrontier/cds-ts-dispatcher';

@UnboundActions()
class UnboundActionsHandler {
  ...
  constructor() {}
  // all unbound actions
  ...
```

`Imported it in the CDSDispatcher`

```typescript
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';

module.exports = new CDSDispatcher([UnboundActionsHandler, ...]).initialize();
```

> [!NOTE]
> The reason behind introducing a distinct decorator for `Unbound actions` stems from the fact that these actions are not associated with any specific `Entity` but instead these actions belongs to the Service itself.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

#### Fields

##### Inject

**@Inject**(`serviceIdentifier: ServiceIdentifierOrFunc<unknown>`)

The `@Inject` decorator is utilized as a `field-level` decorator and allows you to inject dependencies into your classes.

`Parameters`

- `serviceIdentifier(ServiceIdentifierOrFunc<unknown>)`: A Class representing the service to inject.

`Example`

```typescript
import { Service } from "@sap/cds";

import { EntityHandler, Inject, ServiceHelper } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
class CustomerHandler {
  ...
  @Inject(CustomerService) private customerService: CustomerService
  @Inject(ServiceHelper.SRV) private srv: Service
  ...
  constructor() {}
  ...
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Inject SRV

**@Inject**(`ServiceHelper.SRV`) `private srv: CdsService`

This specialized `@Inject` can be used as a `constant` in `@ServiceLogic, @Repository, @EntityHandler and @UnboundActions` classes, It can be accessed trough `this.srv` and contains the `CDS srv` for further enhancements.

`Example`

```typescript
import { Service } from "@sap/cds";
import { EntityHandler, Inject, ServiceHelper } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
// OR @ServiceLogic()
// OR @Repository()
class CustomerHandler { // OR CustomerService, CustomerRepository
  ...
  @Inject(ServiceHelper.SRV) private srv: Service
  ...
  constructor() {}
  ...
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

#### Methods

##### Before

Use `@BeforeCreate(), @BeforeRead(), @BeforeUpdate(), @BeforeDelete()` to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeCreate

**@BeforeCreate**()

It is important to note that decorator `@BeforeCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeCreate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCreate()
public async beforeCreateMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('CREATE', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeRead

**@BeforeRead**()

It is important to note that decorator `@BeforeRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeRead, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeRead()
public async beforeReadMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('READ', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeUpdate

**@BeforeUpdate**()

It is important to note that decorator `@BeforeUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeUpdate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeUpdate()
public async beforeUpdateMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('UPDATE', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeDelete

**@BeforeDelete**()

It is important to note that decorator `@BeforeDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeDelete, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeDelete()
public async beforeDeleteMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('DELETE', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### After

Use `@AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.` The handlers receive two arguments:

The results from the preceding `.on` handler, with the following types:

- `results` (of type `MyEntity[]`) for `@AfterRead`
- `results` (of type `MyEntity`) for `@AfterUpdate` and `@AfterCreate`
- `deleted` (of type `boolean`) for `@AfterDelete`

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-After](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterCreate

**@AfterCreate**()

It is important to note that decorator `@AfterCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterCreate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCreate()
public async afterCreateMethod(results: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('CREATE', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterRead

**@AfterRead**()

`Example`

It is important to note that decorator `@AfterRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` `MyEntity`

```typescript
import { AfterRead, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
public async afterReadMethod(results: MyEntity[], req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('READ', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterUpdate

**@AfterUpdate**()

It is important to note that decorator `@AfterUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterUpdate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterUpdate()
public async afterUpdateMethod(result: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('UPDATE', MyEntity, async (result, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterDelete

**@AfterDelete**()

It is important to note that decorator `@AfterDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { Request } from "@sap/cds";
import { AfterDelete } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterDelete()
public async afterDeleteMethod(deleted: boolean, req: Request) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('DELETE', MyEntity, async (deleted, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### On

Use `@OnCreate(), @OnRead(), @OnUpdate(), @OnDelete(), OnAction(), @OnFunction(), @OnBoundAction(), @OnBoundFunction()` handlers to fulfill requests, e.g. by reading/writing data from/to databases handlers.

The handlers receive one argument:

- `req` of type `TypedRequest`
- `next` of type `Function`

See also the official SAP JS **[CDS-On](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnCreate

**@OnCreate**()

It is important to note that decorator `@OnCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnCreate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCreate()
public async onCreateMethod(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('CREATE', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnRead

**@OnRead**()

It is important to note that decorator `@OnRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnRead, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnRead()
public async onReadMethod(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('READ', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnUpdate

**@OnUpdate**()

It is important to note that decorator `@OnUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript

import { OnUpdate, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnUpdate()
public async onUpdateMethod(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('UPDATE', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnDelete

**@OnDelete**()

It is important to note that decorator `@OnDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnDelete, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnDelete()
public async onDeleteMethod(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('DELETE', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnAction

**@OnAction**(`name` : CdsAction)

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`, generated using the [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

`Example`

```typescript

import { OnAction, ActionRequest, ActionReturn } from "@dxfrontier/cds-ts-dispatcher";
import { AnAction } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnAction(AnAction)
public async onActionMethod(req: ActionRequest<typeof AnAction>, next: Function): ActionReturn<typeof AnAction> {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(AnAction, async (req, next) => {
  // ...
});
```

> [!NOTE]
> AnAction was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnFunction

**@OnFunction**(`name` : CdsFunction)

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`, generated using the [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

`Example`

```typescript
import { OnFunction, ActionRequest, ActionReturn } from "@dxfrontier/cds-ts-dispatcher";
import { AFunction } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnFunction(AFunction)
public async onFunctionMethod(req: ActionRequest<typeof AFunction>, next: Function): ActionReturn<typeof AFunction> {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(AFunction, async (req) => {
  // ...
});
```

> [!NOTE]
> AFunction was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnBoundAction

**@OnBoundAction**(`name` : CdsAction)

It is important to note that decorator `@OnBoundAction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`, generated using the [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

`Example`

```typescript
import { OnBoundAction, ActionRequest, ActionReturn } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnBoundAction(MyEntity.actions.AnAction)
public async onActionMethod(req: ActionRequest<typeof MyEntity.actions.AnAction>, next: Function): ActionReturn<typeof MyEntity.actions.AnAction>
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(MyEntity.actions.AnAction, MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnBoundFunction

**@OnBoundFunction**(`name` : CdsFunction)

It is important to note that decorator `@OnBoundFunction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`, generated using the [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

`Example`

```typescript
import { OnBoundFunction, ActionRequest, ActionReturn } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnBoundFunction(MyEntity.actions.AFunction)
public async onFunctionMethod(req: ActionRequest<typeof MyEntity.actions.AFunction>, next: Function): ActionReturn<typeof MyEntity.actions.AFunction> {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(MyEntity.actions.AFunction, MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Fiori draft

Use `@OnNewDraft(), @OnCancelDraft(), @OnEditDraft(), OnSaveDraft()` handlers to support for both, `active and draft entities`.

The handlers receive one argument:

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-Fiori-draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)**

###### Draft

**@Draft()**

The `@Draft()` decorator is utilized at the `method-level` to annotate a method that this method and all decorators which are used along with this `Draft()` decorator, will be marked as a `Draft`.

`Important`

When utilizing the `@Draft()` decorator, the `placement of the @Draft() decorator` within your TypeScript class is very important factor to consider. It determines the scope of the `draft` mode within the methods that precede it.

`@Draft` can be used together with the following decorator actions :

- `@BeforeCreate, @BeforeRead, @BeforeUpdate, @BeforeDelete`
- `@AfterCreate, @AfterRead, @AfterUpdate, @AfterDelete`
- `@OnBoundAction, @OnBoundFunction`

`Example 1`

```typescript
import { AfterRead, AfterUpdate, AfterDelete, OnBoundAction, Draft, TypedRequest} from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterUpdate() // Will be marked as draft
@AfterDelete() // Will be marked as draft
@AfterRead() // Will be marked as draft
@Draft() // All methods above '@Draft()' will be triggered on 'MyEntity.drafts'
public async draftMethod(results: MyEntity[], req: TypedRequest<MyEntity>) {
  // ...
}

@OnBoundAction(MyEntity.actions.AnAction)
@Draft()
public async onActionMethod(req: ActionRequest<typeof MyEntity.actions.AnAction>, next: Function): ActionReturn<typeof MyEntity.actions.AnAction>
  // ...
}

```

`Equivalent to 'JS'`

```typescript
this.after(['UPDATE, CREATE, READ'], MyEntity.drafts, async (req) => {
  // ...
});

this.on(MyEntity.actions.AnAction, MyEntity.drafts, async (req, next) => {
  // ...
});
```

`Example 2`

When using `@Draft()` in-between other `Decorators`. The above decorators of the `@Draft()` will be placed `only as Draft`.
The rest `Decorators` below `@Draft()` will be work on active entities.

```typescript
import { AfterCreate, AfterUpdate, AfterRead, OnBoundAction, Draft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterUpdate() // Marked as a draft
@Draft() // Draft is in-between 'after', this means that only '@AfterUpdate' will me marked as draft
@AfterCreate() // Will work on active entity
@AfterRead() // Will work on active entity
public async draftMethodAndNonDraft(results: MyEntity[], req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
// FOR DRAFT
this.after('UPDATE', MyEntity.drafts, async (results, req) => {
  // ...
});

// FOR ACTIVE ENTITIES
this.after(['CREATE', 'READ'], MyEntity, async (results, req) => {
  // ...
});
```

`Example 3`

`Alternative to all above is to split between` `@Draft` and `Active entities`.

```typescript
import { BeforeUpdate, BeforeCreate, Draft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeUpdate()
@BeforeCreate()
@Draft() // All above decorators will be marked AS DRAFT
public async draftMethod(req: TypedRequest<MyEntity>) {
  // ...
}

// All decorators will work only FOR ACTIVE ENTITIES
@BeforeUpdate()
@BeforeCreate()
public async methodWithoutDraft(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
// FOR DRAFT
this.before(['UPDATE', 'CREATE'], MyEntity.drafts, async (req) => {
  // ...
});

// FOR ACTIVE ENTITIES
this.before(['UPDATE', 'CREATE'], MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnNewDraft

**@OnNewDraft()**

This decorator will be triggered when `a new draft is created`.

It is important to note that decorator `@OnNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnNewDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnNewDraft()
public async onNewDraft(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('NEW', MyEntity.drafts, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnCancelDraft

**@OnCancelDraft()**

This decorator will be triggered when `a draft is cancelled`.

It is important to note that decorator `@OnCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnCancelDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCancelDraft()
public async onCancelDraft(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('CANCEL', MyEntity.drafts, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnEditDraft

**@OnEditDraft()**

This decorator will be triggered when `a new draft is created from an active instance`

It is important to note that decorator `@OnEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnEditDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnEditDraft()
public async onEditDraft(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('EDIT', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnSaveDraft

**@OnSaveDraft()**

This decorator will be triggered when `the active entity is changed`

It is important to note that decorator `@OnSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript

import { OnSaveDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnSaveDraft()
public async onSaveDraft(req: TypedRequest<MyEntity>, next: Function) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('SAVE', MyEntity, async (req, next) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### SingleInstanceCapable

**@SingleInstanceCapable()**

The `@SingleInstanceCapable()` decorator is utilized at the `method-level` to annotate a method that all decorators which are used along with this `@SingleInstanceCapable()` decorator, will handle also single `instance Request`.

###### Usage

When `@SingleInstanceCapable` is applied to a method, a `3td parameter` should be added for example : `isSingleInstance: boolean`.

- This parameter allows you to differentiate between `single instance requests` and `entity set requests` and adjust the behavior accordingly.

When utilizing the `@SingleInstanceCapable()` decorator, the `placement of the @SingleInstanceCapable() decorator` within your TypeScript class is very important factor to consider. It defines the scope of the `single instance` mode within the methods that precede it.

`@SingleInstanceCapable` can be used together with the following decorator actions :

- `@AfterRead`
- `@BeforeRead`
- `@OnRead`

`Example 1` : Handling both single instance and entity set requests

All methods `AfterRead() 'BeforeRead()', 'OnRead()'` will be executed on single instance when `isSingleInstance => true` request and `isSingleInstance => false` when entity set is requested.

- Example single request : http://localhost:4004/odata/v4/main/ `MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`
- Example entity set request : http://localhost:4004/odata/v4/main/ `MyEntity`

```typescript

import { AfterRead, SingleInstanceCapable, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead() // Will handle single instance and entity set
@SingleInstanceCapable() // All methods above '@SingleInstanceCapable()' will be triggered when single instance is requested and entity set
public async singeInstanceMethodAndEntitySet(results : MyEntity[], req: TypedRequest<MyEntity>, isSingleInstance: boolean) {
  if(isSingleInstance) {
    return this.customerService.handleSingleInstance(req)
  }

  return this.customerService.handleEntitySet(req)
}
```

`Example 2` : Differing behavior for single instance and entity set requests

Method `AfterRead()` will be executed on single instance request and entity set
Method `BeforeRead()` will be executed only on entity set request.

- Example single request : http://localhost:4004/odata/v4/main/ `MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`
- Example entity set request : http://localhost:4004/odata/v4/main/ `MyEntity`

```typescript
@AfterRead() //  Will handle single instance and entity set
@SingleInstanceCapable() // All methods above '@SingleInstanceCapable()' will be triggered when single instance is requested and entity set
@BeforeRead() // Will handle only entity set
public async singeInstanceMethodAndEntitySet(results : MyEntity[], req: TypedRequest<MyEntity>, isSingleInstance: boolean) {
  if(isSingleInstance) {
    return this.customerService.handleSingleInstance(req)
  }

  return this.customerService.handleEntitySet(req)
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Examples

Find here a collection of samples for the [CDS-TS-Dispatcher-Samples](https://github.com/dxfrontier/cds-ts-samples)

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[![Licence](https://img.shields.io/github/license/Ileriayo/markdown-badges?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

## Authors

- [@dragolea](https://github.com/dragolea)
- [@sblessing](https://github.com/sblessing)
- [@ABS GmbH](https://www.abs-gmbh.de/) team

<p align="right">(<a href="#readme-top">back to top</a>)</p>
