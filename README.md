# CDS-TS Dispatcher

<img src="https://img.shields.io/badge/SAP-0FAAFF?style=for-the-badge&logo=sap&logoColor=white" /> <img src="https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white" /> <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" /> <img src="https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white" /> <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" />

The goal of CDS-TS-Dispatcher is to significantly reduce the boilerplate code required to implement TS handlers provided by the SAP CAP framework.

## Table of Contents

- [CDS-TS Dispatcher](#cds-ts-dispatcher)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Install CDS-TS-Dispatcher - New project](#install-cds-ts-dispatcher---new-project)
    - [Install CDS-TS-Dispatcher - Existing project](#install-cds-ts-dispatcher---existing-project)
    - [`Generate CDS Typed entities`](#generate-cds-typed-entities)
      - [Option 1 - `Recommended`](#option-1---recommended)
      - [Option 2](#option-2)
      - [`Important`](#important)
  - [Architecture](#architecture)
  - [Usage](#usage)
    - [`CDSDispatcher`](#cdsdispatcher)
      - [Parameters](#parameters)
      - [Method](#method)
    - [`Decorators`](#decorators)
      - [Class](#class)
        - [EntityHandler](#entityhandler)
        - [ServiceLogic](#servicelogic)
        - [Repository](#repository)
          - [`[Optional]` - BaseRepository](#optional---baserepository)
        - [UnboundActions](#unboundactions)
      - [Fields](#fields)
        - [Inject](#inject)
        - [Inject SRV](#inject-srv)
      - [Methods - `active entity`](#methods---active-entity)
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
      - [Methods : `draft entity`](#methods--draft-entity)
        - [Before](#before-1)
          - [BeforeNewDraft](#beforenewdraft)
          - [BeforeCancelDraft](#beforecanceldraft)
          - [BeforeEditDraft](#beforeeditdraft)
          - [BeforeSaveDraft](#beforesavedraft)
        - [After](#after-1)
          - [AfterNewDraft](#afternewdraft)
          - [AfterCancelDraft](#aftercanceldraft)
          - [AfterEditDraft](#aftereditdraft)
          - [AfterSaveDraft](#aftersavedraft)
        - [On](#on-1)
          - [OnNewDraft](#onnewdraft)
          - [OnCancelDraft](#oncanceldraft)
          - [OnEditDraft](#oneditdraft)
          - [OnSaveDraft](#onsavedraft)
        - [`Other` draft handlers](#other-draft-handlers)
      - [Method : `SingleInstanceCapable`](#method--singleinstancecapable)
        - [Complementary Decorator Actions](#complementary-decorator-actions)
        - [Examples](#examples)
  - [`Examples`](#examples-1)
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
npm install @dxfrontier/cds-ts-dispatcher @sap/cds express
npm install --save-dev @types/node @cap-js/sqlite typescript
```

4. Add a **tsconfig.json** :

```bash
tsc --init
```

5. It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "outDir": "./gen/srv/srv",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
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
    "target": "ES2020",
    "outDir": "./gen/srv/srv",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "skipLibCheck": true
  }
}
```

> [!WARNING]
> If below message appears
>
> ```bash
> -----------------------------------------------------------------------
> WARNING: Package '@sap/cds' was loaded from different installations: [
>  '***/node_modules/@sap/cds/lib/index.js',
>  '***/node_modules/@dxfrontier/cds-ts-dispatcher/node_modules/@sap/cds/lib/index.js'
> ] Rather ensure a single install only to avoid hard-to-resolve errors.
> -----------------------------------------------------------------------
> ```
>
> Run the following command :
>
> ```bash
> npm install @sap/cds@latest
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Generate CDS Typed entities`

#### Option 1 - `Recommended`

Execute the following commands :

```bash
cds add typer
```

```bash
npm install
```

> [!TIP]
> If above option is being used, this means whenever we change a `.CDS` file the changes will be reflected in the generated `@cds-models` folder.

#### Option 2

Execute the command :

```bash
npx @cap-js/cds-typer "*" --outputDirectory ./srv/util/types/entities
```

- Target folder :`./srv/util/types/entities` - Change to your desired destination folder.

> [!TIP]
> If above option is being used, you have to run every time the command when you do a change in a `.CDS file`

#### `Important`

> [!CAUTION]
> Import always the `generated entities from the service folders and not from the index.ts`

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/common/cds_typer_entities_@cds-models.png?raw=true)

For more info see official **[SAP CDS-Typer](https://cap.cloud.sap/docs/tools/cds-typer)** page.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Architecture

**We recommend adhering** to the **Controller-Service-Repository** design pattern using the following folder structure:

1. [EntityHandler](#entityhandler) `(Controller)` - Responsible for managing the REST interface to the business logic implemented in [ServiceLogic](#servicelogic)
2. [ServiceLogic](#servicelogic) `(Service)` - Contains business logic implementations
3. [Repository](#repository) `(Repository)` - This component is dedicated to handling entity manipulation operations by leveraging the power of [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql).

`Controller-Service-Repository` suggested folder structure

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure.png?raw=true) <= expanded folders => ![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure_expanded.png?raw=true)

## Usage

### `CDSDispatcher`

**CDSDispatcher**(`entities` : `Constructable[]`)

The `CDSDispatcher` constructor allows you to create an instance for dispatching and managing entities.

<!-- `CDSDispatcher` class will initialize all **[Entity handler](#entityhandler)(s)** and all of their dependencies : [Services](#servicelogic), [Repositories](#repository). -->

#### Parameters

- `entities (Array)`: An array of **[Entity handler](#entityhandler)(s)** (Constructable) that represent the entities in the CDS.

#### Method

- `initialize`: The `initialize` method of the `CDSDispatcher` class is used to initialize **[Entity handler](#entityhandler)(s)** and all of their dependencies : [Services](#servicelogic), [Repositories](#repository).

<!-- `CDSDispatcher` class will initialize all **[Entity handler](#entityhandler)(s)** and all of their dependencies : [Services](#servicelogic), [Repositories](#repository). -->

`Example`

```typescript
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';

module.exports = new CDSDispatcher([
  BookHandler,
  ReviewHandler,
  UnboundActionsHandler,
  // ...
]).initialize();
```

`Visual image`

<img src="https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/usage_cdsDispatcher.png?raw=true">

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Decorators`

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

###### `[Optional]` - BaseRepository

The **[BaseRepository](https://github.com/dxfrontier/cds-ts-repository)** was designed to reduce the boilerplate code required to implement data access layer for persistance entities.

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Fields

##### Inject

**@Inject**(`serviceIdentifier: ServiceIdentifierOrFunc<unknown>`)

The `@Inject` decorator is utilized as a `field-level` decorator and allows you to inject dependencies into your classes.

`Parameters`

- `serviceIdentifier(ServiceIdentifierOrFunc<unknown>)`: A Class representing the service to inject.

`Example`

```typescript
import { EntityHandler, Inject, SRV, Service } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
class CustomerHandler {
  ...
  @Inject(CustomerService) private customerService: CustomerService
  @Inject(SRV) private srv: Service
  ...
  constructor() {}
  ...
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### Inject SRV

**@Inject**(SRV) `private srv: Service`

This specialized `@Inject` can be used as a `constant` in `@ServiceLogic, @Repository, @EntityHandler and @UnboundActions` classes, it can be accessed trough `this.srv` and contains the `CDS srv` for further enhancements.

`Example`

```typescript
import { EntityHandler, Inject, SRV, Service } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
// OR @ServiceLogic()
// OR @Repository()
// OR @UnboundActions
class CustomerHandler { // OR CustomerService, CustomerRepository
  ...
  @Inject(SRV) private srv: Service
  ...
  constructor() {}
  ...
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Methods - `active entity`

##### Before

Use `@BeforeCreate(), @BeforeRead(), @BeforeUpdate(), @BeforeDelete()` to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

> [!NOTE]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use `@BeforeCreateDraft(), BeforeReadDraft(), @BeforeUpdateDraft(), @BeforeDeleteDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### After

Use `@AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.`

The handlers receive two arguments:

- `results` (for `@AfterRead`): An array of type `MyEntity[]`.
- `result` (for `@AfterUpdate` and `@AfterCreate`): An object of type `MyEntity`.
- `deleted` (for `@AfterDelete`): A `boolean` indicating whether the entity was deleted.
- `req`: An object of type `TypedRequest`.

See also the official SAP JS **[CDS-After](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request) event**

> [!NOTE]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use `@AfterCreateDraft(), AfterReadDraft(), @AfterUpdateDraft(), @AfterDeleteDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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
this.after('CREATE', MyEntity, async (result, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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
this.after('READ', MyEntity, async (results, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### AfterDelete

**@AfterDelete**()

It is important to note that decorator `@AfterDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterDelete, Request} from "@dxfrontier/cds-ts-dispatcher";
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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### On

Use `@OnCreate(), @OnRead(), @OnUpdate(), @OnDelete(), OnAction(), @OnFunction(), @OnBoundAction(), @OnBoundFunction()` handlers to fulfill requests, e.g. by reading/writing data from/to databases handlers.

The handlers receive two arguments:

- `req` of type `TypedRequest`
- `next` of type `Function`

See also the official SAP JS **[CDS-On](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request) event**

> [!NOTE]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use `@OnCreateDraft(), @OnReadDraft(), @OnUpdateDraft(), @OnDeleteDraft(), @OnBoundActionDraft(), @OnBoundFunctionDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### OnAction

**@OnAction**(`name` : CdsAction)

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### OnFunction

**@OnFunction**(`name` : CdsFunction)

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`.

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### OnBoundAction

**@OnBoundAction**(`name` : CdsAction)

It is important to note that decorator `@OnBoundAction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`.

`Example`

```typescript
import { OnBoundAction, ActionRequest, ActionReturn } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnBoundAction(MyEntity.actions.AnAction)
public async onActionMethod(req: ActionRequest<typeof MyEntity.actions.AnAction>, next: Function): ActionReturn<typeof MyEntity.actions.AnAction> {
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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### OnBoundFunction

**@OnBoundFunction**(`name` : CdsFunction)

It is important to note that decorator `@OnBoundFunction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`.

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Methods : `draft entity`

##### Before

Use `@BeforeNewDraft(), @BeforeCancelDraft(), @BeforeEditDraft(), @BeforeSaveDraft(), @BeforeCreateDraft(), @BeforeReadDraft(), @BeforeUpdateDraft(), @BeforeDeleteDraft()` to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

###### BeforeNewDraft

**@BeforeNewDraft**()

Use this decorator when you want to validate inputs before a new draft is created.

It is important to note that decorator `@BeforeNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeNewDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeNewDraft()
public async beforeCreateDraftMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('NEW', MyEntity.drafts, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### BeforeCancelDraft

**@BeforeCancelDraft**()

Use this decorator when you want to validate inputs before a draft is discarded.

It is important to note that decorator `@BeforeCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeCancelDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCancelDraft()
public async beforeCancelDraftMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('CANCEL', MyEntity.drafts, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### BeforeEditDraft

**@BeforeEditDraft**()

Use this decorator when you want to validate inputs when a new draft is created from an active instance.

It is important to note that decorator `@BeforeEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeEditDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeEditDraft()
public async beforeEditDraftMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('EDIT', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### BeforeSaveDraft

**@BeforeSaveDraft**()

Use this decorator when you want to validate inputs when active entity is changed.

It is important to note that decorator `@BeforeSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeSaveDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeSaveDraft()
public async beforeSaveDraftMethod(req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('SAVE', MyEntity, async (req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### After

Use `@AfterNewDraft(), @AfterCancelDraft(), @AfterEditDraft(), @AfterSaveDraft(), @AfterCreateDraft(), @AfterReadDraft(), @AfterUpdateDraft(), @AfterDeleteDraft()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.` The handlers receive two arguments:

The results from the preceding `.on` handler, with the following types:

- `results` (of type `MyEntity[]`) for `@AfterRead`
- `result` (of type `MyEntity`) for `@AfterUpdate` and `@AfterCreate`
- `deleted` (of type `boolean`) for `@AfterDelete`

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-After](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request) event**

###### AfterNewDraft

**@AfterNewDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created.

It is important to note that decorator `@AfterNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterNewDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterNewDraft()
public async afterNewDraftMethod(results: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('NEW', MyEntity.drafts, async (results, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### AfterCancelDraft

**@AfterCancelDraft**()

Use this decorator when you want to enhance outbound data when a draft is discarded.

It is important to note that decorator `@AfterCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterCancelDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCancelDraft()
public async afterCancelDraftMethod(results: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('CANCEL', MyEntity.drafts, async (results, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### AfterEditDraft

**@AfterEditDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created from an active instance.

It is important to note that decorator `@AfterEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterEditDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterEditDraft()
public async afterEditDraftMethod(results: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('EDIT', MyEntity, async (results, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### AfterSaveDraft

**@AfterSaveDraft**()

Use this decorator when you want to enhance outbound data when the active entity is changed.

It is important to note that decorator `@AfterSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterSaveDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterSaveDraft()
public async afterSaveDraftMethod(results: MyEntity, req: TypedRequest<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('SAVE', MyEntity, async (results, req) => {
  // ...
});
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### On

Use `@OnNewDraft(), @OnCancelDraft(), @OnCancelDraft(), @OnSaveDraft(), @OnReadDraft(), @OnUpdateDraft(), @OnCreateDraft(), @OnDeleteDraft(), @OnBoundActionDraft(), @OnBoundFunctionDraft()` handlers to support for both, active and draft entities.

The handlers receive two arguments:

- `req` of type `TypedRequest`
- `next` of type `Function`

See Official SAP **[Fiori-draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)**

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `Other` draft handlers

All active entity [On](#on), [Before](#before), [After](#after) events have also a `Draft` variant.

> [!NOTE]
> Except the `@OnAction(), @OnFunction()` as this are bound to the service and not to an entity.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Method : `SingleInstanceCapable`

**@SingleInstanceCapable()**

The `@SingleInstanceCapable()` decorator is applied at the method level to indicate that all decorators used in conjunction with this decorator will handle both single instance and entity set requests, this behaves like a **switch** when the REQUEST is entity set and single instance, so you can manage different behavior.

##### Complementary Decorator Actions

`@SingleInstanceCapable` can be used together with the following decorator actions :

- [@AfterRead()](#afterread)
- [@BeforeRead()](#beforeread)
- [@OnRead()](#onread)

##### Examples

`Example 1` : Handling single instance request

- Example single request : http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)

```typescript

import { AfterRead, SingleInstanceCapable, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
@SingleInstanceCapable()
public async singeInstanceMethodAndEntitySet(results : MyEntity[], req: TypedRequest<MyEntity>, isSingleInstance: boolean) {
  if(isSingleInstance) {
    // This will be executed only when single instance read is performed
    // isSingleInstance flag will be `true`
    return this.customerService.handleSingleInstance(req)
  }
}
```

`Example 2` : Differing behavior for single instance and entity set requests

- Example single request : http://localhost:4004/odata/v4/main/ `MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`
- Example entity set request : http://localhost:4004/odata/v4/main/ `MyEntity`

```typescript
@AfterRead()
@SingleInstanceCapable()
@BeforeRead()
public async singeInstanceMethodAndEntitySet(results : MyEntity[], req: TypedRequest<MyEntity>, isSingleInstance: boolean) {
  if(isSingleInstance) {
    // This method will be executed for 'AfterRead` single instance
    return this.customerService.handleSingleInstance(req)
  }

  // This method will be executed for `BeforeRead` both cases : single instance & entity set
  return this.customerService.handleEntitySet(req)
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## `Examples`

Find here a collection of samples for the [CDS-TS-Dispatcher-Samples](https://github.com/dxfrontier/cds-ts-samples)

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

![Licence](https://img.shields.io/github/license/Ileriayo/markdown-badges?style=for-the-badge)

Copyright (c) 2023 DXFrontier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Authors

- [@dragolea](https://github.com/dragolea)
- [@sblessing](https://github.com/sblessing)
- [@ABS GmbH](https://www.abs-gmbh.de/) team

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>
