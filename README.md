<h2> CDS-TS-Dispatcher </h2>

![SAP](https://img.shields.io/badge/SAP-0FAAFF?style=for-the-badge&logo=sap&logoColor=white)
![ts-node](https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white)
![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![json](https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

![NPM Downloads](https://img.shields.io/npm/dy/@dxfrontier/cds-ts-dispatcher?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/%40dxfrontier%2Fcds-ts-dispatcher?logo=npm)
![NPM Version](https://img.shields.io/npm/v/%40dxfrontier%2Fcds-ts-dispatcher?logo=npm)

![Tests](https://img.shields.io/github/actions/workflow/status/dxfrontier/cds-ts-dispatcher/tests.yml?logo=git&label=test%20(unit%2C%20e2e%2C%20integration))
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/dxfrontier/cds-ts-dispatcher/deployment.yaml?logo=git)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/dxfrontier/cds-ts-dispatcher/main?logo=git)
![GitHub issues](https://img.shields.io/github/issues/dxfrontier/cds-ts-dispatcher?logo=git)
![GitHub contributors](https://img.shields.io/github/contributors/dxfrontier/cds-ts-dispatcher?logo=git)
![GitHub Repo stars](https://img.shields.io/github/stars/dxfrontier/cds-ts-dispatcher?style=flat&logo=git)

The goal of **CDS-TS-Dispatcher** is to significantly reduce the boilerplate code required to implement **Typescript handlers** provided by the SAP CAP framework.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [`Option 1 :` Install CDS-TS-Dispatcher - `New project`](#option-1--install-cds-ts-dispatcher---new-project)
  - [`Option 2 :` Install CDS-TS-Dispatcher - `Existing TypeScript project`](#option-2--install-cds-ts-dispatcher---existing-typescript-project)
  - [`Generate CDS Typed entities`](#generate-cds-typed-entities)
    - [`Important`](#important)
  - [`Migration:` from @sap/cds `v7` to `v8`](#migration-from-sapcds-v7-to-v8)
- [Usage](#usage)
  - [`Architecture`](#architecture)
  - [`CDSDispatcher`](#cdsdispatcher)
  - [`Decorators`](#decorators)
    - [`Class`](#class)
      - [@EntityHandler](#entityhandler)
      - [@ServiceLogic](#servicelogic)
      - [@Repository](#repository)
        - [`[Optional]` - CDS-TS-Repository - BaseRepository](#optional---cds-ts-repository---baserepository)
      - [@UnboundActions](#unboundactions)
      - [@Use](#use)
    - [`Field`](#field)
      - [@Inject](#inject)
      - [@Inject(`CDS_DISPATCHER.SRV`)](#injectcds_dispatchersrv)
      - [@Inject(CDS\_DISPATCHER.OUTBOXED\_SRV)](#injectcds_dispatcheroutboxed_srv)
    - [`Parameter`](#parameter)
      - [@Req](#req)
      - [@Res](#res)
      - [@Results / @Result](#results--result)
      - [@Next](#next)
      - [@Error](#error)
      - [@Jwt](#jwt)
      - [@IsPresent](#ispresent)
      - [@IsRole](#isrole)
      - [@IsColumnSupplied](#iscolumnsupplied)
      - [@GetQuery](#getquery)
      - [@GetRequest](#getrequest)
      - [@SingleInstanceSwitch](#singleinstanceswitch)
      - [@ValidationResults](#validationresults)
      - [@Locale](#locale)
      - [@Env](#env)
      - [@Msg](#msg)
    - [`Method`-`active entity`](#method-active-entity)
      - [`Before`](#before)
        - [@BeforeCreate](#beforecreate)
        - [@BeforeRead](#beforeread)
        - [@BeforeUpdate](#beforeupdate)
        - [@BeforeDelete](#beforedelete)
        - [@BeforeAll](#beforeall)
      - [`After`](#after)
        - [@AfterCreate](#aftercreate)
        - [@AfterRead](#afterread)
        - [@AfterReadEachInstance](#afterreadeachinstance)
        - [@AfterUpdate](#afterupdate)
        - [@AfterDelete](#afterdelete)
        - [@AfterAll](#afterall)
      - [`On`](#on)
        - [@OnCreate](#oncreate)
        - [@OnRead](#onread)
        - [@OnUpdate](#onupdate)
        - [@OnDelete](#ondelete)
        - [@OnAction](#onaction)
        - [@OnFunction](#onfunction)
        - [@OnEvent](#onevent)
        - [@OnSubscribe](#onsubscribe)
        - [@OnError](#onerror)
        - [@OnBoundAction](#onboundaction)
        - [@OnBoundFunction](#onboundfunction)
        - [@OnAll](#onall)
    - [`Method`-`draft entity`](#method-draft-entity)
      - [`Before`](#before-1)
        - [@BeforeNewDraft](#beforenewdraft)
        - [@BeforeCancelDraft](#beforecanceldraft)
        - [@BeforeEditDraft](#beforeeditdraft)
        - [@BeforeSaveDraft](#beforesavedraft)
      - [`After`](#after-1)
        - [@AfterNewDraft](#afternewdraft)
        - [@AfterCancelDraft](#aftercanceldraft)
        - [@AfterEditDraft](#aftereditdraft)
        - [@AfterSaveDraft](#aftersavedraft)
      - [`On`](#on-1)
        - [@OnNewDraft](#onnewdraft)
        - [@OnCancelDraft](#oncanceldraft)
        - [@OnEditDraft](#oneditdraft)
        - [@OnSaveDraft](#onsavedraft)
      - [`Other draft decorators`](#other-draft-decorators)
    - [`Method`-`helpers`](#method-helpers)
      - [@AfterReadSingleInstance](#afterreadsingleinstance)
      - [@Prepend](#prepend)
      - [@Validate](#validate)
      - [@FieldsFormatter](#fieldsformatter)
      - [@ExecutionAllowedForRole](#executionallowedforrole)
      - [@Use](#use-1)
      - [@CatchAndSetErrorCode](#catchandseterrorcode)
      - [@CatchAndSetErrorMessage](#catchandseterrormessage)
- [`Deployment` to BTP using MTA](#deployment-to-btp-using-mta)
- [`Best practices` \& `tips`](#best-practices--tips)
- [`Samples`](#samples)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)

## Prerequisites

Install [**@sap/cds-dk**](https://cap.cloud.sap/docs/get-started/), `typescript`, `ts-node` globally:

```bash
npm install -g @sap/cds-dk typescript ts-node
```

## Installation

### `Option 1 :` Install CDS-TS-Dispatcher - `New project`

<!-- #### `Using:` @sap/cds `v8` -->

Use the following steps if you want to create a new **SAP CAP project.**

1. Create new folder :

```bash
mkdir project
cd project
```

2. Initialize the CDS folder structure :

```bash
cds init
```

3. Add `TypeScript` and [CDS-Typer](#generate-cds-typed-entities) to your npm package.json:

```bash
cds add typescript
```

4. Add `CDS-TS-Dispatcher` to your npm package.json :

```bash
npm install @dxfrontier/cds-ts-dispatcher
```

5. It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,

    "strict": true,

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    "target": "ES2021",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "outDir": "./gen/srv",
    "rootDir": ".",

    "paths": {
      "#cds-models/*": ["./@cds-models/*/index.ts"]
    }
  },
  "include": ["./srv", "./@dispatcher"]
}
```

6. Install packages

```bash
npm install
```

7. Run the `CDS-TS` server

```bash
cds-ts w
```

> [!IMPORTANT]
> CDS-TS-Dispatcher uses `@sap/cds`, `@sap/cds-dk` [version 8](https://cap.cloud.sap/docs/releases/jun24)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Option 2 :` Install CDS-TS-Dispatcher - `Existing TypeScript project`

Use the following steps if you want to add only the **@dxfrontier/cds-ts-dispatcher to an existing project :**

```bash
npm install @dxfrontier/cds-ts-dispatcher
```

It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "strictPropertyInitialization": false,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "strictNullChecks": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    "strict": true,

    "lib": ["es2022"],

    "outDir": "./gen/srv"
  },
  "include": ["./srv"]
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
> npm install -g @sap/cds-dk@latest
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Generate CDS Typed entities`

Execute the following commands :

```bash
cds add typer
```

```bash
npm install
```

> [!TIP]
> If above option is being used, this means whenever we change a `.CDS` file the changes will reflect in the generated `@cds-models` folder.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>
<!-- 
#### Option 2

Execute the command :

```bash
npx @cap-js/cds-typer "*" --outputDirectory ./srv/util/types/entities
```

- Target folder :`./srv/util/types/entities` - Change to your desired destination folder.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p> -->

#### `Important`

> [!IMPORTANT]
> Import always the `generated entities` from the `service` folders and not from the `index.ts`

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/common/cds_typer_entities_@cds-models.png?raw=true)

> [!TIP]
> By default cds-typer will create in your `package.json` a quick path alias like :
>
> ```json
> "imports": {
>   "#cds-models/*": "./@cds-models/*/index.js"
> }
> ```
>
> **Use import helper to import entities from `#cds-models` like example :**
>
> - **`import { Book } from '#cds-models/CatalogService';`**

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Migration:` from @sap/cds `v7` to `v8`

Use the following steps if you want to migrate from `@sap/cds@7` to `@sap/cds@8`:

1. Verify you've installed the `cds@v8` globally by running the following command:

```bash
cds -v -i
```

| packages | version                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| @cap-js/asyncapi       | 1.0.1                                                                          |
| @cap-js/cds-typer      | 0.24.0                                                                         |
| @cap-js/cds-types      | 0.6.4                                                                          |
| @cap-js/openapi        | 1.0.4                                                                          |
| @cap-js/sqlite         | 1.7.3                                                                          |
| `@sap/cds`               | `8.1.0`                                                                          |
| @sap/cds-compiler      | 5.1.2                                                                          |
| `@sap/cds-dk (global)`   | `8.0.2`                                                                          |
| @sap/cds-fiori         | 1.2.7                                                                          |
| @sap/cds-foss          | 5.0.1                                                                          |
| @sap/cds-lsp           | 8.0.0                                                                          |
| @sap/cds-mtxs          | 1.18.2                                                                         |
| @sap/eslint-plugin-cds | 3.0.4                                                                          |
| Node.js                | v22.4.1                                                                        |

> [!TIP]
> If you see a smaller version than `@sap/cds-dk (global)` `8.0.2` run the following command :
>
> ```bash
> npm install -g @sap/cds-dk@latest
> ```

2. Run the following command inside of your project:

```bash
cds add typescript
```

> [!TIP]
> Command above will add the following packages:
>
> - `@types/node`
> - `@cap-js/cds-types`
> - `@cap-js/cds-typer`
> - `typescript`

3. After running command above the `package.json` will look similar to :

```json
{
  "dependencies": {
    "@dxfrontier/cds-ts-dispatcher": "^4.0.0",
    "@dxfrontier/cds-ts-repository": "^5.1.6",
    "@sap/cds": "^8.7.2"
  },
  "devDependencies": {
    "@cap-js/sqlite": "^1.8.0",
    "@cap-js/cds-types": "^0.9.0",
    "typescript": "^5.5.4",
    "@types/node": "^22.1.0",
    "@cap-js/cds-typer": "0.33.0"
  },
  "scripts": {
    "start": "cds-serve",
    "watch": "cds-ts w",
  },
}
```

> [!IMPORTANT]
> You might delete the `node_modules` folder and `package-lock.json` in case `npm run watch` fails working.
>
> Re-run the following command :
>
> ```bash
> npm install
> ```

## Usage

### `Architecture`

**We recommend adhering** to the **Controller-Service-Repository** design pattern using the following folder structure:

1. [EntityHandler](#entityhandler) `(Controller)` - Responsible for managing the REST interface to the business logic implemented in [ServiceLogic](#servicelogic)
2. [ServiceLogic](#servicelogic) `(Service)` - Contains business logic implementations
3. [Repository](#repository) `(Repository)` - This component is dedicated to handling entity manipulation operations by leveraging the power of [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql).

`Controller-Service-Repository` suggested folder structure

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure.png?raw=true) <= expanded folders => ![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure_expanded.png?raw=true)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

> [!TIP]
> You can have a look over the [CDS-TS-Dispatcher-Samples](https://github.com/dxfrontier/cds-ts-samples) where we use the Controller-Service-Repository pattern and Dispatcher.

### `CDSDispatcher`

**CDSDispatcher**(`entities` : `Constructable[]`)

The `CDSDispatcher` constructor allows you to create an instance for dispatching and managing entities.

`Parameters`

- `entities (Array)`: An array of **[Entity handler](#entityhandler)(s)** (Constructable) that represent the entities in the CDS.

`Method`

- `initialize`: The `initialize` method of the `CDSDispatcher` class is used to initialize **[Entity handler](#entityhandler)(s)** and all of their dependencies : [Services](#servicelogic), [Repositories](#repository), [UnboundActions](#unboundactions)

`Example`

```typescript
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';

export = new CDSDispatcher([
  // Entities
  BookHandler,
  ReviewHandler,
  BookStatsHandler,
  // Draft
  BookEventsHandler,
  // Unbound actions
  UnboundActionsHandler,
]).initialize();

// or use
// module.exports = new CDSDispatcher([ ...
```

`Visual image`

<img src="https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/usage_cdsDispatcher.png?raw=true">

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Decorators`

#### `Class`

##### @EntityHandler

The `@EntityHandler` decorator is utilized at the `class-level` to annotate a class with:

1. A specific `entity` that will serve as the base entity for all handler decorators within the class.
2. `'*'` as `all entities` that will serve as the base entity for all handler decorators within the class.

`Overloads`

| Method                               | Parameters                               | Description                                                                                                                                                                                                                                                                                                                                                                            |
| :----------------------------------- | :--------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. EntityHandler(`entity`: CDSTyper) | Must be a `CDS-Typer` generated class    | It ensures that all handlers within the class operate with the specified `entity context`.                                                                                                                                                                                                                                                                                             |
| 2. EntityHandler(`entity`: `'*'`)    | A wildcard `'*'` indicating all entities | It ensures that all handlers within the class operate with a generic context indicating that registered events will be triggered for all `all entities` (`active entities` and `draft entities`) <br /> <br /> Excluded will be [@OnAction()](#onaction), [@OnFunction()](#onfunction), [@OnEvent()](#onevent), [@OnError()](#onerror) as these actions belongs to the Service itself. |

`Parameters`

- `entity (CDSTyperEntity | '*')`: A specialized class generated using the [CDS-Typer](#generate-cds-typed-entities) or generic wild card `'*'` applicable to all entities.

`Example 1` using `CDS-Typer`

```typescript
import { EntityHandler } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'
}
```
> [!TIP]
> After creation of `BookHandler` class, you can `import it` into the [CDSDispatcher](#cdsdispatcher).
>
> ```typescript
> import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
>
> export = new CDSDispatcher([
>   // Entities
>   BookHandler,
>   // Unbound actions
>   // ...
> ]).initialize();
> ```

`Example 2` using `*` wildcard indicating that events will be triggered for all entities

```typescript
import { EntityHandler, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES) // or use the '*'
export class AllEntities {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered on all entities using wildcard '*'
}
```
> [!TIP]
> After creation of `AllEntities` class, you can `import it` into the [CDSDispatcher](#cdsdispatcher).
>
> ```typescript
> import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';
>
> export = new CDSDispatcher([
>   // Entities
>   AllEntities,
>   // Unbound actions
>   // ...
> ]).initialize();
> ```


> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @ServiceLogic

**@ServiceLogic()**

The `@ServiceLogic` decorator is utilized at the `class-level` to annotate a `class` as a specialized class containing only business logic.

`Example`

```typescript
import { ServiceLogic } from '@dxfrontier/cds-ts-dispatcher';

@ServiceLogic()
export class CustomerService {
  // ...
  constructor() {}
  // ...
}
```

> [!TIP]
> When applying `@ServiceLogic()` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Repository

**@Repository()**

The `@Repository` decorator is utilized as a `class-level` annotation that designates a particular `class` as a specialized `Repository`, this class should contain only [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql) code.

```typescript
import { Repository } from '@dxfrontier/cds-ts-dispatcher';

@Repository()
export class CustomerRepository {
  // ...
  constructor() {}
  // ...
}
```

> [!TIP]
> When applying `@Repository()` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`.

###### `[Optional]` - CDS-TS-Repository - BaseRepository

The **[CDS-TS-Repository - BaseRepository](https://github.com/dxfrontier/cds-ts-repository)** was designed to reduce the boilerplate code required to implement data access layer for persistance entities.

It simplifies the implementation by offering a set of ready-to-use actions for interacting with the database. These actions include:

- `.create()`: Create new records in the database.
- `.getAll()`: Retrieve all records from the database.
- `.find()`: Query the database to find specific data.
- `.delete()`: Remove records from the database.
- `.exists()`: Check the existence of data in the database.
- and many more ...

`Example`

```typescript
import { Repository } from '@dxfrontier/cds-ts-dispatcher';
import { BaseRepository } from '@dxfrontier/cds-ts-repository';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@Repository()
export class CustomerRepository extends BaseRepository<MyEntity> {
  constructor() {
    super(MyEntity);
  }

  public async aMethod() {
    const created = await this.create(...)
    const createdMany = await this.createMany(...)
    const updated = await this.update(...)
    // ...
  }
}
```

To get started, refer to the official documentation **[CDS-TS-Repository - BaseRepository](https://github.com/dxfrontier/cds-ts-repository)**.
Explore the capabilities it offers and enhance your data access layer with ease.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @UnboundActions

**@UnboundActions()**

The `@UnboundActions` decorator is utilized at the `class-level` to annotate a `class` as a specialized class which will be used only for **_Unbound actions._**

The following decorators can be used inside of `@UnboundActions()` :

- [@OnAction()](#onaction)
- [@OnFunction()](#onfunction)
- [@OnEvent()](#onevent)
- [@OnError()](#onerror)
- [@OnSubscribe()](#onsubscribe)

`Example`

```typescript
import { UnboundActions, OnAction, OnFunction, OnEvent, Req, Next, Error, OnSubscribe } from '@dxfrontier/cds-ts-dispatcher';
import { MyAction, MyFunction, MyEvent } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { ActionRequest, ActionReturn, Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

@UnboundActions()
export class UnboundActionsHandler {
  // ... @Inject dependencies, if needed.

  constructor() {}

  // Unbound action
  @OnAction(MyAction)
  private async onActionMethod(
    @Req() req: ActionRequest<typeof MyAction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof MyAction> {
    // ...
  }

  // Unbound Function
  @OnFunction(MyFunction)
  private async onFunctionMethod(
    @Req() req: ActionRequest<typeof MyFunction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof MyFunction> {
    // ...
  }

  // Unbound event
  @OnEvent(MyEvent)
  private async onEventMethod(@Req() req: Request<MyEvent>) {
    // ...
  }

  // Unbound error
  @OnError()
  private onErrorMethod(@Error() err: Error, @Req() req: Request) {
    // ...
  }

  // Unbound event
  @OnSubscribe({ 
    eventName: 'event_name'
    type: 'SAME_NODE_PROCESS' 
  })
  private async onSubscribe(@Req() req: Request<{foo: string, bar: number}>): Promise<void> {
    // 
  }
}
```

`Imported it` in the [CDSDispatcher](#cdsdispatcher)

```typescript
import { CDSDispatcher } from '@dxfrontier/cds-ts-dispatcher';

export = new CDSDispatcher([ UnboundActionsHandler, ...])
// or
// use module.exports = new CDSDispatcher( ... )
```

> [!NOTE]
> The reason behind introducing a distinct decorator for `Unbound actions` stems from the fact that these actions are not associated with any specific `Entity` but instead these actions belongs to the Service itself.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Use

**@Use**(`...Middleware[]`)

The `@Use` decorator simplifies the integration of middlewares into your classes.

When `@Use` decorator applied at the `class-level` this decorator inject middlewares into the class and gain access to the `req: Request` and `next: NextMiddleware` middleware across all events `(@AfterRead, @OnRead ...)` within that class.

Middleware decorators can perform the following tasks:

- Execute any code.
- Make changes to the request object.
- End the request-response cycle.
- Call the next middleware function in the stack.
- If the current middleware function does not end the request-response cycle, it must call `next()` to pass control to the next middleware function. Otherwise, the request will be left hanging.

`Parameters`

- `...Middleware[])`: Middleware classes to be injected.

`Example:` middleware implementation:

```typescript
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareClass implements MiddlewareImpl {
  public async use(req: Request, next: NextMiddleware) {
    console.log('Middleware use method called.');

    await next(); // call next middleware
  }
}
```

> [!TIP]
>
> Inside of the decorator `use` method you can use [@CatchAndSetErrorCode](#catchandseterrorcode) and [@CatchAndSetErrorMessage](#catchandseterrormessage) decorators.

`Example` usage:

```typescript
import { EntityHandler, Use, Inject, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';
import { Middleware1, Middleware2, MiddlewareN } from 'YOUR_MIDDLEWARE_LOCATION';

import type { Service } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
@Use(Middleware1, Middleware2, MiddlewareN)
export class CustomerHandler {
  // ...
  @Inject(CDS_DISPATCHER.SRV) private srv: Service;
  // ...
  constructor() {}
  // ...
}
```

> [!TIP]
>
> 1. Think of it _(middleware)_ like as a reusable class, enhancing the functionality of all events within the class.
> 2. Middlewares when applied with `@Use` are executed before the normal events.
> 3. If you need to apply middleware to a `method` you should use the method specific [@Use](#use-1) decorator .

> [!WARNING]
> If `req.reject()` is used inside of middleware this will stop the stack of middlewares, this means that next middleware will not be executed.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Field`

##### @Inject

**@Inject**(`serviceIdentifier: ServiceIdentifierOrFunc<unknown>`)

The `@Inject` decorator is utilized as a `field-level` decorator and allows you to inject dependencies into your classes.

`Parameters`

- `serviceIdentifier(ServiceIdentifierOrFunc<unknown>)`: A Class representing the service to inject.

`Example`

```typescript
import { EntityHandler, Inject, CDS_DISPATCHER } from "@dxfrontier/cds-ts-dispatcher";
import type { Service } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  ...
  @Inject(CustomerService) private customerService: CustomerService
  @Inject(CustomerRepository) private customerService: CustomerRepository
  @Inject(AnyOtherInjectableClass) private repository: AnyOtherInjectableClass

  @Inject(CDS_DISPATCHER.SRV) private srv: Service
  // ...
  constructor() {}
  // ...
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Inject(`CDS_DISPATCHER.SRV`)

**@Inject**(`CDS_DISPATCHER.SRV`) private srv: `Service`

This specialized `@Inject` can be used as a `constant` in and contains the `CDS.ApplicationService` for further enhancements.

It can be injected in the following :

- [@EntityHandler()](#entityhandler)
- [@ServiceLogic()](#servicelogic)
- [@Repository()](#repository)
- [@UnboundActions()](#unboundactions)

`Example`

```typescript
import { EntityHandler, Inject, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Service } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
// OR @ServiceLogic()
// OR @Repository()
// OR @UnboundActions()
export class CustomerHandler {
  // @Inject dependencies
  @Inject(CDS_DISPATCHER.SRV) private readonly srv: Service;

  constructor() {}
  // ...
}
```

> [!TIP]
> The CDS.ApplicationService can be accessed trough `this.srv`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Inject(CDS_DISPATCHER.OUTBOXED_SRV)

**@Inject**(`CDS_DISPATCHER.OUTBOXED_SRV`) private srv: `Service`

This specialized `@Inject` can be used as a `constant` and contains the `CDS.outboxed` service.

It can be injected in the following :

- [@EntityHandler()](#entityhandler)
- [@ServiceLogic()](#servicelogic)
- [@Repository()](#repository)
- [@UnboundActions()](#unboundactions)

`Example`

```typescript
import { EntityHandler, Inject, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Service } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
// OR @ServiceLogic()
// OR @Repository()
// OR @UnboundActions()
export class CustomerHandler {
  // @Inject dependencies
  @Inject(CDS_DISPATCHER.OUTBOXED_SRV) private readonly outboxedSrv: Service;

  constructor() {}
  // ...
}
```

> [!TIP]
> More info about `outboxed` ca be found at [SAP CAP Node.js Outboxed](https://cap.cloud.sap/docs/node.js/outbox)

> [!TIP]
> The CDS.ApplicationService can be accessed trough `this.outboxedSrv`

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Parameter`

##### @Req

**@Req()**

The `@Req` decorator is utilized at the `parameter level` to annotate a parameter with the `Request` object, providing access to request-related information of the current event.

`Return`

- `Request`: An instance of `@sap/cds` - `Request`

`Example`

```typescript
import { EntityHandler, Req, Results } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead ...

  @AfterRead()
  private async aMethod(@Req() req: Request, @Results() results: MyEntity[]) {
    // ... req...
  }
}
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Res

**@Res()**

The `@Res` decorator is utilized at the `parameter level` to annotate a parameter with the `Request.http.res - (Response)` object, providing access to response-related information of the current event and it can be used to enhance the `Response`.

`Return`

- `RequestResponse`: An instance of `RequestResponse` providing you response-related information.

`Example`

```typescript
import { EntityHandler, Req, Results } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request, RequestResponse } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead ...

  @AfterRead()
  private async aMethod(@Req() req: Request, @Res() response: RequestResponse, @Results() results: MyEntity[]) {
    // Example: we assume we want to add a new header language on the response
    // We use => res.setHeader('Accept-Language', 'DE_de');
  }
}
```

> [!TIP]
> Decorator `@Res` can be used in all [After](#after), [Before](#before) and [On](#on) events.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Results / @Result

**@Results()** / **@Result**

The `@Results` decorator is utilized at the `parameter level` to annotate a parameter with the request `Results`.

`Return`

- `Array / object`: Contains the OData Request `Body`.

`Example`

```typescript
import { EntityHandler, Req, Results } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead ...

  @AfterRead()
  private async aMethod(@Req() req: Request, @Results() results: MyEntity[]) {
    // ...
  }
}
```

> [!TIP]
> When using [@AfterCreate()](#aftercreate), [@AfterUpdate()](#afterupdate) and [@AfterDelete()](#afterdelete) it's recommended to use the `@Result` decorator for single object result and `@Results` for arrays of objects.

```ts
@AfterCreate()
@AfterUpdate()
private async aMethod(
   @Result() result: Book, // <== @Result() decorator used to annotate it's a an object and not an array
   @Req() req: Request,
 ) {
   // ...
 }

@AfterRead()
private async aMethod(
  @Results() result: Book[], // <== @Results() decorator used to annotate as array of objects
  @Req() req: Request,
) {
  // ...
}

@AfterDelete()
private async aMethod(
@Result() deleted: boolean, // <== @Result() decorator used to annotate as a boolean
@Req() req: Request,
) {
  // ...
}
```

> [!TIP]
> Decorators `@Results()` and `@Result()` can be applied to all [After](#after) events.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Next

**@Next()**

The `@Next` decorator is utilized at the `parameter level` to annotate a parameter with the `Next` function, which is used to proceed to the next event in the chain of execution.

`Return`

- `NextEvent`: The next event in chain to be called.

`Example`

```typescript
import { EntityHandler, Req, Results } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead, @OnCreate ...

  @OnCreate()
  public async onCreate(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
    return next();
  }
}
```

> [!TIP]
> Decorator `@Next` can be applied to all [On](#on), [On - draft](#on-1) event decorators.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Error

**@Error()**

The `@Error` decorator is utilized at the `parameter level` to annotate a parameter with the `Error` and contains information regarding the failed `Request`.

`Return`

- `Error`: An instance of type `Error`.

`Example`

```typescript
import { UnboundActions, Req, Error } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@UnboundActions()
export class UnboundActionsHandler {
  // ...
  constructor() {}

  @OnError()
  public onError(@Error() err: Error, @Req() req: Request): void {
    // ...
  }
}
```

> [!TIP]
> Decorator `@Error` can be applied to [@OnError()](#onerror) decorator which resides inside of the [@UnboundActions()](#unboundactions).

##### @Jwt

**@Jwt()**

The `@Jwt` decorator is utilized at the `parameter level`. It will retrieve the to retrieve `JWT` from the `Request` that is based on the node `req.http.req - IncomingMessage`.

Fails if no authorization header is given or has the wrong format.

`Return`

- `string` | `undefined` : The retrieved `JWT token` or undefined if no token was found.

`Example`

```typescript
import { EntityHandler, Req, Results, Jwt } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead ...

  @AfterRead()
  private async aMethod(@Req() req: Request, @Results() results: MyEntity[], @Jwt() jwt: string | undefined) {
    // ... req...
  }
}
```

> [!IMPORTANT]
> Expected format is `Bearer <TOKEN>`.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsPresent

**@IsPresent\<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey\<Key>)**

The `@IsPresent` decorator is utilized at the `parameter level`. It allows you to verify the existence of a specified Query `property` values.

`Parameters`

- `key (string)`: Specifies the type of query operation. Accepted values are `INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`.
- `property (string)`: Specifies the property based on the `key`.

`Return`

- `boolean`: This decorator returns `true` if `property` `value` is filled, `false` otherwise

`Example`

```typescript
import { EntityHandler, Req, Results, IsPresent } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
class BookHandler {
  // ...
  constructor() {}

  @AfterRead()
  private async aMethod(
    @Req() req: Request,
    @Results() results: MyEntity[],

    @IsPresent('SELECT', 'columns') columnsPresent: boolean,
  ) {
    if (columnsPresent) {
      // ...
    }

    // ...
  }
}
```

> [!TIP]
> Decorator [@IsPresent()](#ispresent) works well with [@GetQuery()](#getquery).

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsRole

**@IsRole(...roles: string[])**

The `@IsRole` decorator is utilized at the `parameter level`. It allows you to verify
if the `User` has assigned a given role.

It applies an logical `OR` on the specified roles, meaning it checks if at `least one` of the specified roles is assigned

`Parameters`

- `role (...string[])`: An array of role names to check if are assigned.

`Return`

- `boolean`: This decorator returns `true` if at least one of the specified roles is assigned to the current request user, otherwise `false`.

`Example`

```typescript
import { EntityHandler, Req, Results, IsPresent, IsRole } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
class BookHandler {
  // ...
  constructor() {}

  @AfterRead()
  private async aMethod(
    @Req() req: Request,
    @Results() results: MyEntity[],

    @IsRole('role', 'anotherRole') roleAssigned: boolean,
  ) {
    if (roleAssigned) {
      // ...
    }

    // ...
  }
}
```

> [!TIP]
> The role names correspond to the values of `@requires` and the `@restrict.grants.to` annotations in your `CDS` models.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsColumnSupplied

**@IsColumnSupplied\<T\>(field : keyof T)**

The `@IsColumnSupplied<T>(field : keyof T)` decorator is utilized at the `parameter level`. It allows your to verify the existence of a column in the `SELECT`, `INSERT` or `UPSERT` Query.

`Parameters`

- `field (string)`: A string representing the name of the column to be verified.

`Type Parameters`

- `T`: The entity type (e.g., `MyEntity`) representing the table or collection on which the decorator operates. This allows TypeScript to enforce type safety for the field parameter.

`Return` :

- `boolean`: This decorator returns `true` if `field / column` was found, `false` otherwise

`Example`

```typescript
import { EntityHandler, Req, Results, IsPresent } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
class BookHandler {
  // ...
  constructor() {}

  @AfterRead()
  private async aMethod(
    @Req() req: Request,
    @Results() results: MyEntity[],

    @IsColumnSupplied<MyEntity>('price') priceSupplied: boolean,
  ) {
    if (priceSupplied) {
      // ...
    }

    // ...
  }
}
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @GetQuery

**@GetQuery\<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey\<Key>)**

The `@GetQuery` decorator is utilized at the `parameter level`. It allows you to retrieve Query `property` values.

`Parameters`

- `key (string)`: Specifies the type of query operation. Accepted values are `INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`.
- `property (string)`: Specifies the property based on the `key`.

`Return`: Varies based on the specified property :

- <details>

  <summary>SELECT</summary>

  - @GetQuery(`'SELECT'`, `'columns'`) columns: `GetQueryType['columns']['forSelect']`
  - @GetQuery(`'SELECT'`, `'distinct'`) distinct: `GetQueryType['distinct']`
  - @GetQuery(`'SELECT'`, `'excluding'`) excluding: `GetQueryType['excluding']`
  - @GetQuery(`'SELECT'`, `'from'`) from: `GetQueryType['from']['forSelect']`
  - @GetQuery(`'SELECT'`, `'groupBy'`) groupBy: `GetQueryType['groupBy']`
  - @GetQuery(`'SELECT'`, `'having'`) having: `GetQueryType['having']`
  - @GetQuery(`'SELECT'`, `'limit'`) limit: `GetQueryType['limit']`
  - @GetQuery(`'SELECT'`, `'limit.rows'`) limitRows: `GetQueryType['limit']['rows']`
  - @GetQuery(`'SELECT'`, `'limit.offset'`) limitOffset: `GetQueryType['limit']['offset']`
  - @GetQuery(`'SELECT'`, `'mixin'`) mixin: `GetQueryType['mixin']`
  - @GetQuery(`'SELECT'`, `'one'`) one: `GetQueryType['one']`
  - @GetQuery(`'SELECT'`, `'orderBy'`) orderBy: `GetQueryType['orderBy']`
  - @GetQuery(`'SELECT'`, `'where'`) where: `GetQueryType['where']`

  </details>

- <details>

  <summary>INSERT</summary>

  - @GetQuery(`'INSERT'`, `'as'`) as: `GetQueryType['as']`
  - @GetQuery(`'INSERT'`, `'columns'`) columns: `GetQueryType['columns']['forInsert']`
  - @GetQuery(`'INSERT'`, `'entries'`) entries: `GetQueryType['entries']`
  - @GetQuery(`'INSERT'`, `'into'`) into: `GetQueryType['into']`
  - @GetQuery(`'INSERT'`, `'rows'`) rows: `GetQueryType['rows']`
  - @GetQuery(`'INSERT'`, `'values'`) values: `GetQueryType['values']`

  </details>

- <details>

    <summary>UPDATE</summary>

  - @GetQuery(`'UPDATE'`, `'data'`) data: `GetQueryType['data']`
  - @GetQuery(`'UPDATE'`, `'entity'`) entity: `GetQueryType['entity']`
  - @GetQuery(`'UPDATE'`, `'where'`) where: `GetQueryType['where']`

  </details>

- <details>

    <summary>UPSERT</summary>

  - @GetQuery(`'UPSERT'`, `'columns'`) columns: `GetQueryType['columns'][forUpsert]`
  - @GetQuery(`'UPSERT'`, `'entries'`) entries: `GetQueryType['entries']`
  - @GetQuery(`'UPSERT'`, `'into'`) into: `GetQueryType['into']`
  - @GetQuery(`'UPSERT'`, `'rows'`) rows: `GetQueryType['rows']`
  - @GetQuery(`'UPSERT'`, `'values'`) values: `GetQueryType['values']`

  </details>

- <details>

    <summary>DELETE</summary>

  - @GetQuery(`'DELETE'`, `'from'`) from: `GetQueryType['from'][forDelete]`
  - @GetQuery(`'DELETE'`, `'where'`) columns: `GetQueryType['where']`

    </details>

`Example`

```typescript
import { EntityHandler, Req, Results, IsPresent, GetQuery } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request, GetQueryType } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
class BookHandler {
  // ...
  constructor() {}

  @AfterRead()
  private async aMethod(
    @Req() req: Request,
    @Results() results: MyEntity[],

    // Check existence of columns
    @IsPresent('SELECT', 'columns') columnsPresent: boolean,

    // Get columns
    @GetQuery('SELECT', 'columns') columns: GetQueryType['columns']['forSelect'],

    @GetQuery('SELECT', 'orderBy') orderBy: GetQueryType['orderBy'],
    @GetQuery('SELECT', 'groupBy') groupBy: GetQueryType['groupBy'],
  ) {
    if (columnsPresent) {
      // do something with columns values
      // columns.forEach(...)
    }

    // ...
  }
}
```

> [!TIP]
> Decorator [@GetQuery()](#getquery) can be used to get the Query property and [@IsPresent()](#ispresent) can check if the Query property is empty or not.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @GetRequest

**@GetRequest(property : keyof Request)**

The `@GetRequest` decorator is utilized at the `parameter level`. It allows you to retrieve the specified `property` value from the `Request` object.

`Parameters`

- `property (string)`: Specifies the property to retrieve from the `Request` object.

`Return`: Varies based on the specified property :

- **@GetRequest**(`'entity'`) entity: `Request['entity']`,
- **@GetRequest**(`'event'`) event: `Request['event']`,
- **@GetRequest**(`'features'`) features: `Request['features']`,
- **@GetRequest**(`'headers'`) headers: `Request['headers']`,
- **@GetRequest**(`'http'`) http: `Request['http']`,
- **@GetRequest**(`'id'`) id: `Request['id']`,
- **@GetRequest**(`'locale'`) locale: `Request['locale']`,
- **@GetRequest**(`'method'`) method: `Request['method']`,
- **@GetRequest**(`'params'`) params: `Request['params']`,
- **@GetRequest**(`'query'`) query: `Request['query']`,
- **@GetRequest**(`'subject'`) subject: `Request['subject']`,
- **@GetRequest**(`'target'`) target: `Request['target']`,
- **@GetRequest**(`'tenant'`) tenant: `Request['tenant']`,
- **@GetRequest**(`'timestamp'`) timestamp: `Request['timestamp']`,
- **@GetRequest**(`'user'`) user: `Request['user']`,

`Example`

```typescript
import { EntityHandler, Results, GetRequest } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
class BookHandler {
  // ...
  constructor() {}

  @AfterRead()
  private async aMethod(
    // @Req() req: Request, we assume we don't need the hole Request object and we need only 'locale' and 'method'
    @Results() results: MyEntity[],

    @GetRequest('locale') locale: Request['locale'],
    @GetRequest('method') method: Request['method'],
  ) {
    // do something with 'locale' and 'method' ...
  }
}
```

> [!TIP]
> Type `Request` can be import from :
>
> ```ts
> import type { Request } from '@dxfrontier/cds-ts-dispatcher';
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @SingleInstanceSwitch

**@SingleInstanceSwitch**

The `@SingleInstanceSwitch()` decorator is applied at the `parameter level`.

It allows you to manage different behaviors based on whether the request is for a `single entity instance` or `an entity set`, the parameter assigned to the decorator will behave like a **`switch`**.

`Return`

- `true` when the `Request` is `single instance`
- `false` when the `Request` is `entity set`

`Example 1`

Single request : <http://localhost:4004/odata/v4/main/`MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`>

```typescript
import { AfterRead, SingleInstanceCapable } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async singeInstanceMethodAndEntitySet(@Results() results : MyEntity[], @Req() req: Request<MyEntity>, @SingleInstanceSwitch() isSingleInstance: boolean) {
  if(isSingleInstance) {
    // This will be executed only when single instance is called : http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)
    return this.customerService.handleSingleInstance(req)
  }

  // nothing to entity set
}
```

`Example 2`

Entity request : <http://localhost:4004/odata/v4/main/`MyEntity`>

```typescript
import { AfterRead, SingleInstanceCapable } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async singeInstanceMethodAndEntitySet(@Results() results : MyEntity[], @Req() req: Request<MyEntity>, @SingleInstanceSwitch() isSingleInstance: boolean) {
  if(isSingleInstance) {
    // This will be executed only when single instance is called : http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)
    // ...
  }

  // ... this will be executed when entity set is called : http://localhost:4004/odata/v4/main/MyEntity
  results[0] = {
    name : 'new value'
  }
}
```

> [!TIP]
> Decorator `@SingleInstanceSwitch` can be used together with the following decorator events:
>
> - [@AfterRead()](#afterread)
> - [@BeforeRead()](#beforeread)
> - [@OnRead()](#onread)

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @ValidationResults

**@ValidationResults**

The `@ValidationResults` decorator allows to capture and inject validation results directly into a method parameter, allowing access to `individual validation flags` within the decorated method.

When used alongside the [@Validate](#validate) decorator, it enables you to perform conditional logic based on specific validation outcomes.

`Example`

```ts
@BeforeCreate()
@Validate<MyEntity>({ action: 'isLowercase', exposeValidatorResult: true }, 'comment')
@Validate<MyEntity>({ action: 'endsWith', target: 'N', exposeValidatorResult: true }, 'description')
public async beforeCreate(
  @Req() req: Request<MyEntity>,
  @ValidationResults() validator: ValidatorFlags<'isLowercase' | 'endsWith'>
) {
    // Conditional handling based on validation flags
    if (validator.isLowercase) {
      // Execute logic when field `comment` is lowercase 
    }
    else {
      // Execute logic when field `comment` is not lowercase
    }

    if (validator.endsWith) {
      // Execute logic when field `description` is endsWith with letter 'N'
    }
    else {
      // Execute logic when field `description` doesn't endsWith with letter 'N'
    }
}
```

> [!IMPORTANT]
> For `@ValidationResults` to work, each [@Validate](#validate) decorator must set the `exposeValidatorResult` option to `true`. This ensures that the validation results are available as flags in the method.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Locale

**@Locale**

Parameter decorator used to inject locale information into a method parameter.

`Example`

```ts
@BeforeCreate()
public async beforeCreate(
  @Req() req: Request<MyEntity>,
  @Locale() locale: string
) {
  if (locale === 'en-US') {
    // handle logic specific to the 'en-US' locale
  }
}
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Env

**@Env\<T\>(env: PropertyStringPath\<T\>)**

The `@Env` decorator is a parameter decorator used to inject values from the cds.env configuration object directly into a method parameter.

`Parameters`

- `env (string)`: A string path representing a property from `cds.env`. This path follows the format `property string path`, which allows access to deeply nested configuration properties.
  - E.g. : `'requires.db.credentials.url'` corresponds to **cds.env.requires.db.credentials.url** object.

`Type Parameters`

- `T`: The `CDS environmental variables` type (e.g., `cds env get`) representing the collection on which the decorator operates. This allows TypeScript to enforce type safety.

`Return` :

- The decorator returns the value of the specified `cds.env` property value.

`Example`

```ts
import { CDS_ENV } from '#dispatcher';  

@BeforeCreate()
public async beforeCreate(
  @Req() req: Request<MyEntity>,
  @Env<CDS_ENV>('requires.db.credentials.url') dbUrl: CDS_ENV['requires']['db']['credentials']['url'],
  // or @Env<CDS_ENV>('requires.db.credentials.url') dbUrl: string
  // or @Env<CDS_ENV>('requires.db.credentials.url') dbUrl: any
  // or any other type if you do not want to use the CDS_ENV generated types
) {
  if (dbUrl) {
    // handle custom logic ...
  }
}
```

> [!NOTE]
> When you install cds-ts-dispatcher `(e.g. npm install @dxfrontier/cds-ts-dispatcher)` or run a general `npm install`, the following will be generated or updated :
>
> - New `@dispatcher` folder is generated at the project _**root**_.
> This folder contains the `CDS ENV TS interfaces`, generated based on the structure of your current `cds.env` project specific configuration (retrieved from `cds env get` cli command).
>
> ```text
> ...
> @dispatcher
> ...
> ```
>
> - `package.json` will be updated with a new `import`:
>
> ```json
>  "imports": {
>    "#dispatcher": "./@dispatcher/index.js"
>  }
> ```
>
> - `tsconfig.json` will be updated:  
>
> ```json
>  "include": [
>    "...",
>    "./@dispatcher"
>  ]
> ```
>
> - `.gitignore` will be updated::
>
> ```text
> ...
> @dispatcher
> ```

> [!NOTE]
> The `@dispatcher` folder is _**regenerated each time you run npm install.**_

> [!TIP]
> You can import the generated `CDS env` from the generated `@dispatcher` folder by using :
>
> ```ts
> import { CDS_ENV } from '#dispatcher'; 
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Msg

**@Msg()**

The `@Msg` decorator is a parameter decorator used to inject response [Emitter](#https://cap.cloud.sap/docs/guides/messaging/#typical-emitter-and-receiver-roles) response object directly into a method parameter.

`Parameters`

`Return` :

- The decorator returns an object of type : 

```ts
{
  event: string,
  data: any,
  headers: any,
  inbound: boolean
}
```

`Example`

```ts
import { OnSubscribe, Messaging } from '@dxfrontier/cds-ts-dispatcher';  
import type { SubscriberType } from '@dxfrontier/cds-ts-dispatcher';  

@OnSubscribe({
  eventName: 'AnEventName',
  type: 'MESSAGE_BROKER',
})
public async onSubscribe(@Msg() msg: SubscriberType<{ foo: number; bar: string }>): Promise<void> {
  // ...
}
```
> [!IMPORTANT]
> To have the `msg` typed you can use TypeScript type `SubscriberType<T>` where T can be a CDS event or any object

> [!TIP]
> Decorator `@Msg` should be used exclusively on decorator [@OnSubscribe](#onsubscribe).


<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Method`-`active entity`

##### `Before`

Use [@BeforeCreate()](#beforecreate), [@BeforeRead()](#beforeread), [@BeforeUpdate()](#beforeupdate), [@BeforeDelete()](#beforedelete) to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `Request`

See also the official SAP JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

> [!TIP]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use
>
> - `@BeforeCreateDraft()`
> - `@BeforeReadDraft()`
> - `@BeforeUpdateDraft()`
> - `@BeforeDeleteDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeCreate

**@BeforeCreate**()

`Example`

```typescript
import { BeforeCreate } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCreate()
private async beforeCreateMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('CREATE', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> It is important to note that the decorator `@BeforeCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeRead

**@BeforeRead**()

`Example`

```typescript
import { BeforeRead } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeRead()
private async beforeReadMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('READ', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeUpdate

**@BeforeUpdate**()

`Example`

```typescript
import { BeforeUpdate } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeUpdate()
private async beforeUpdateMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('UPDATE', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeDelete

**@BeforeDelete**()

`Example`

```typescript
import { BeforeDelete } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeDelete()
private async beforeDeleteMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('DELETE', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeAll

The `@BeforeAll` decorator is triggered whenever **_any CRUD (Create, Read, Update, Delete)_** event occurs, whether the entity is `active` or in `draft` mode.

`ACTIVE ENTITY`

For active entities, the @BeforeAll decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeCreate()](#beforecreate), [@AfterCreate()](#aftercreate), [@OnCreate()](#oncreate)
- `READ` [@BeforeRead()](#beforeread), [@AfterRead()](#afterread), [@OnRead()](#onread)
- `UPDATE` [@BeforeUpdate()](#beforeupdate), [@AfterUpdate()](#afterupdate), [@OnUpdate()](#onupdate)
- `DELETE` [@BeforeDelete()](#beforedelete), [@AfterDelete()](#afterdelete), [@OnDelete()](#ondelete)
- `BOUND ACTIONS` [@OnBoundAction()](#onboundaction)
- `BOUND FUNCTIONS` [@OnBoundFunction()](#onboundfunction)

`DRAFT`

For draft entities, the @BeforeAll decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeNewDraft()](#beforenewdraft), [@AfterNewDraft()](#afternewdraft), [@OnNewDraft()](#onnewdraft)
- `CANCEL` [@BeforeCancelDraft()](#beforecanceldraft), [@AfterCancelDraft()](#aftercanceldraft), [@OnCancelDraft()](#oncanceldraft)
- `EDIT` [@BeforeEditDraft()](#beforeeditdraft), [@AfterEditDraft()](#aftereditdraft), [@OnEditDraft()](#oneditdraft)
- `SAVE` [@BeforeSaveDraft()](#beforesavedraft), [@AfterSaveDraft()](#aftersavedraft), [@OnSaveDraft()](#onsavedraft)
- :heavy_plus_sign: All active entity [Before](#before), [After](#after), [On](#on) events which have a `Draft` variant.

**@BeforeAll**()

`Example 1`

In this example, the `@BeforeAll()` decorator of the `beforeAllEvents` method is executed before any CRUD operation `(CREATE, READ, UPDATE, DELETE, BOUND ACTIONS, BOUND FUNCTIONS))` on the `MyEntity` entity. 

Since the class is annotated with `@EntityHandler(MyEntity)`, the decorator is scoped to this specific `entity`, meaning it will only be triggered for operations related to `MyEntity`.

```typescript
import { BeforeAll, EntityHandler } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @BeforeAll()
  private async beforeAllEvents(@Req() req: Request<MyEntity>) {
    // ...
  }
}
```

`Equivalent to 'JS'`

```typescript
this.before('*', MyEntity, async (req) => {
  // ...
});
```

`Example 2`

In this example, the `@BeforeAll()` decorator is used in a more generic way. Unlike `Example 1`, where it applies only to `MyEntity`, this setup ensures that `beforeAllEvents` is triggered for `all entities`. 

This means the method will execute before any CRUD operation on `any` `entity` handled within the class.

```typescript
import { BeforeAll, EntityHandler, CDS_DISPATCHER } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @BeforeAll()
  private async beforeAllEvents(@Req() req: Request<MyEntity>) {
    // ...
  }
}
```

`Equivalent to 'JS'`

```typescript
this.before('*', '*', async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeAll()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!TIP]
> If the entity has drafts enabled `@odata.draft.enabled: true`, the `@BeforeAll` decorator will still be triggered for draft events.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `After`

Use [@AfterCreate()](#aftercreate), [@AfterRead()](#afterread), [@AfterUpdate()](#afterupdate), [@AfterDelete()](#afterdelete) register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.`

The handlers receive two arguments:

| Parameters     | Decorator                         | Description                                                                |
| -------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `results, req` | `@AfterRead`                      | An array of type `MyEntity[]` and the `Request`.                           |
| `result, req`  | `@AfterUpdate`<br> `@AfterCreate` | An object of type `MyEntity` and the `Request`.                            |
| `deleted, req` | `@AfterDelete`                    | A `boolean` indicating whether the instance was deleted and the `Request`. |

> [!TIP]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use :
>
> - `@AfterCreateDraft()`
> - `@AfterReadDraft()`
> - `@AfterReadDraftSingleInstance()`
> - `@AfterUpdateDraft()`
> - `@AfterDeleteDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterCreate

**@AfterCreate**()

`Example`

```typescript
import { AfterCreate } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCreate()
private async afterCreateMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('CREATE', MyEntity, async (result, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterRead

**@AfterRead**()

`Example`

```typescript
import { AfterRead, Results, Req } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async afterReadMethod(@Results() results: MyEntity[], @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('READ', MyEntity, async (results, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterReadEachInstance

**@AfterReadEachInstance**()

The `@AfterReadEachInstance` decorator is used to execute custom logic after performing a read operation on `each individual instance`. This behavior is analogous to the JavaScript `Array.prototype.forEach` method.

`Example`

```typescript
import { AfterReadEachInstance, Result, Req } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterReadEachInstance()
private async afterEach(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('each', MyEntity, async (result, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterReadEachInstance()` will be triggered based on the [EntityHandler](#entityhandler) `argument` `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterUpdate

**@AfterUpdate**()

`Example`

Single request : <http://localhost:4004/odata/v4/main/`MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`>

```typescript
import { AfterUpdate } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterUpdate()
private async afterUpdateMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('UPDATE', MyEntity, async (result, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterDelete

**@AfterDelete**()

`Example`

```typescript
import { AfterDelete} from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterDelete()
private async afterDeleteMethod(@Result() deleted: boolean, @Req() req: Request) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('DELETE', MyEntity, async (deleted, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterAll

The `@AfterAll` decorator is triggered whenever **_any CRUD (Create, Read, Update, Delete)_** event occurs, whether the entity is `active` or in `draft` mode.

`ACTIVE ENTITY`

For active entities, the `@AfterAll` decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeCreate()](#beforecreate), [@AfterCreate()](#aftercreate), [@OnCreate()](#oncreate)
- `READ` [@BeforeRead()](#beforeread), [@AfterRead()](#afterread), [@OnRead()](#onread)
- `UPDATE` [@BeforeUpdate()](#beforeupdate), [@AfterUpdate()](#afterupdate), [@OnUpdate()](#onupdate)
- `DELETE` [@BeforeDelete()](#beforedelete), [@AfterDelete()](#afterdelete), [@OnDelete()](#ondelete)
- `BOUND ACTIONS` [@OnBoundAction()](#onboundaction)
- `BOUND FUNCTIONS` [@OnBoundFunction()](#onboundfunction)

`DRAFT`

For draft entities, the `@AfterAll` decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeNewDraft()](#beforenewdraft), [@AfterNewDraft()](#afternewdraft), [@OnNewDraft()](#onnewdraft)
- `CANCEL` [@BeforeCancelDraft()](#beforecanceldraft), [@AfterCancelDraft()](#aftercanceldraft), [@OnCancelDraft()](#oncanceldraft)
- `EDIT` [@BeforeEditDraft()](#beforeeditdraft), [@AfterEditDraft()](#aftereditdraft), [@OnEditDraft()](#oneditdraft)
- `SAVE` [@BeforeSaveDraft()](#beforesavedraft), [@AfterSaveDraft()](#aftersavedraft), [@OnSaveDraft()](#onsavedraft)
- :heavy_plus_sign: All active entity [Before](#before), [After](#after), [On](#on) events which have a `Draft` variant.

**@AfterAll**()

`Example 1`

In this example, the `@AfterAll()` decorator of the `afterAll` method is executed after any CRUD operation `(CREATE, READ, UPDATE, DELETE, BOUND ACTIONS, BOUND FUNCTIONS))` on the `MyEntity` entity. 

Since the class is annotated with `@EntityHandler(MyEntity)`, the decorator is scoped to this specific `entity`, meaning it will only be triggered for operations related to `MyEntity`.

```typescript
import { AfterAll, EntityHandler } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @AfterAll()
  private async afterAll(@Result() result: MyEntity | MyEntity[] | boolean, @Req() req: Request) {
    if(Array.isArray(result)) {
      // when after `READ` event was triggered
    }
    else if(typeof result === 'boolean' ) {
      // when after `DELETE` event was triggered
    }
    else {
      // when after `CREATE`, `UPDATE` was triggered
    }

    // ...
  }
}
```

`Equivalent to 'JS'`

```typescript
this.after('*', MyEntity, async (result, req) => {
  // ...
});
```

`Example 2`

In this example, the `@AfterAll()` decorator is used in a more generic way. Unlike `Example 1`, where it applies only to `MyEntity`, this setup ensures that `afterAll` is triggered for `all entities`. 

This means the method will execute before any CRUD operation on `any` `entity` handled within the class.

```typescript
import { AfterAll, EntityHandler} from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @AfterAll()
  private async afterAll(@Result() result: MyEntity | MyEntity[] | boolean, @Req() req: Request) {
    if(Array.isArray(result)) {
      // when after `READ` event was triggered
    }
    else if(typeof result === 'boolean' ) {
      // when after `DELETE` event was triggered
    }
    else {
      // when after `CREATE`, `UPDATE` was triggered
    }

    // ...
  }
}
```

`Equivalent to 'JS'`

```typescript
this.after('*', '*', async (result, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterAll()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!TIP]
> If the entity has drafts enabled `@odata.draft.enabled: true`, the `@AfterAll` decorator will also be triggered for draft events.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `On`

Use [@OnCreate()](#oncreate), [@OnRead()](#onread), [@OnUpdate()](#onupdate), [@OnDelete()](#ondelete), [OnAction()](#onaction), [@OnFunction()](#onfunction), [@OnBoundAction()](#onboundaction), [@OnBoundFunction()](#onboundfunction) handlers to fulfill requests, e.g. by reading/writing data from/to databases handlers.

The handlers receive two arguments:

- `req` of type `Request`
- `next` of type `NextEvent`

> [!TIP]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use :
>
> - `@OnCreateDraft()`
> - `@OnReadDraft()`
> - `@OnUpdateDraft()`
> - `@OnDeleteDraft()`
> - `@OnBoundActionDraft()`
> - `@OnBoundFunctionDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnCreate

**@OnCreate**()

`Example`

```typescript
import { OnCreate, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCreate()
private async onCreateMethod(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...

  return next();
}
```

`Equivalent to 'JS'`

```typescript
this.on('CREATE', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnRead

**@OnRead**()

`Example`

```typescript
import { OnRead, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnRead()
private async onReadMethod(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...

  return next();
}
```

`Equivalent to 'JS'`

```typescript
this.on('READ', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnUpdate

**@OnUpdate**()

`Example`

```typescript

import { OnUpdate, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnUpdate()
private async onUpdateMethod(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...

  return next();
}
```

`Equivalent to 'JS'`

```typescript
this.on('UPDATE', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnDelete

**@OnDelete**()

`Example`

```typescript
import { OnDelete, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnDelete()
private async onDeleteMethod(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...

  return next();
}
```

`Equivalent to 'JS'`

```typescript
this.on('DELETE', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnAction

**@OnAction**(`name` : CdsAction)

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`

`Example`

```typescript

import { OnAction, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { AnAction } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnAction(AnAction)
private async onActionMethod(@Req() req: ActionRequest<typeof AnAction>, @Next() next: NextEvent): ActionReturn<typeof AnAction> {
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

> [!IMPORTANT]  
> Decorator `@OnAction` should be used inside [@UnboundActions()](#unboundactions) class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnFunction

**@OnFunction**(`name` : CdsFunction)

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`.

`Example`

```typescript
import { OnFunction, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { AFunction } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnFunction(AFunction)
private async onFunctionMethod(@Req() req: ActionRequest<typeof AFunction>, @Next() next: NextEvent): ActionReturn<typeof AFunction> {
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

> [!IMPORTANT]  
> Decorator `@OnFunction` should be used inside [@UnboundAction()](#unboundactions) class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnEvent

**@OnEvent**(`name` : CdsEvent)

The `@OnEvent` decorator facilitates the listening of events when the [Emit](https://cap.cloud.sap/docs/guides/messaging/) and receiver are in the same `NODE JS PROCESS` and `SAME SERVICE`.

This decorator is particularly useful in conjunction with the [Emit method](https://cap.cloud.sap/docs/guides/messaging/#emitting-events) to handle triggered events.

`Parameters`

- `name (CdsEvent)` : Representing the `CDS event` defined in the `CDS file`.

`Example`

```typescript
import { OnEvent, Req, OnSubscribe } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { AEvent } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnEvent(AEvent)
private async onEventMethod(@Req() req: Request<AEvent>) {
  // ...
}

// same as

@OnSubscribe({
  eventName: AEvent,
  type: 'SAME_NODE_PROCESS',
})
private async onEventMethod(@Req() req: Request<AEvent>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('AEvent', async (req) => {
  // ...
});
```

> [!NOTE] 
> The `AEvent` was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

> [!IMPORTANT]  
> Decorator `@OnEvent` should be used inside [@UnboundActions](#unboundactions) class.

> [!TIP]
> An exended version of this event can be found [@OnSubscribe](#onsubscribe).

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnSubscribe

```ts
@OnSubscribe(options : {
  eventName: string | object,
  type : 'SAME_NODE_PROCESS' | 'MESSAGE_BROKER' | 'SAME_NODE_PROCESS_DIFFERENT_SERVICE'
  externalServiceName: string // applicable only for 'SAME_NODE_PROCESS_DIFFERENT_SERVICE'
  showReceiverMessage?: boolean
  consoleStyle?: 'table | 'debug'
})
```

Use `@OnSubscribe` decorator enables execution of custom logic when messaging events (`event bus` / `publish subscribe`) are triggered in your SAP CAP application.

This decorator is particularly useful in conjunction with the [Emit method](https://cap.cloud.sap/docs/guides/messaging/#emitting-events) to handle triggered events.

`Parameters`

- `options`:
  - `name`: CdsEvent - The name of the event to subscribe to. This can be a `string` or a `CDS event` type imported from your `@cds-models` folder.
  - `type`: Defines the messaging transport mechanism for SAP CAP applications.
    - `'SAME_NODE_PROCESS'` - Use when both `emitter` and `receiver` run in the same `CAP server instance` & `same service`.
    - `'SAME_NODE_PROCESS_DIFFERENT_SERVICE'` - Use when `emitter` can be found in E.g. `Service A` and `receiver` can reside in E.g. `Service B`, having same `CAP server instance` but `different services`.
    - `'MESSAGE_BROKER'` - Recommended for production with external message brokers, different CAP Server instances, different services.
  - `showReceiverMessage?` `[optional]`: **boolean** - When enabled, logs inbound message payloads in the specified `consoleStyle` format.
  - `externalServiceName`: - The name of the external service to attach the subscribe decorator to. `[Applicable only when type is 'SAME_NODE_PROCESS_DIFFERENT_SERVICE' ]`
  - `consoleStyle?` `[optional]` - Specifies the log output format for received messages (when `showReceiverMessage` is true).
    - `'table'`: Displays data using `console.table()`, ideal for structured messages.
    - `'debug'`: Displays data using  `console.debug()`, ideal for nested or dynamic messages.

`Example 1`

In this example we emit the event in same `node process` and `same service` and we subscribe to it.

`Emitting and subscribing:`

```ts
import { OnSubscribe, Req, OnEvent } from '@dxfrontier/cds-ts-dispatcher';
import type { SubscriberType, Request } from '@dxfrontier/cds-ts-dispatcher';

// Emitting the event
@AfterRead()
private async afterRead(
  @Req() req: Request,
  @Results() results: MyEntity[],
): Promise<void> {
  this.srv.emit('anEventName', { foo: 11, bar: '22' });
}

// Subscribing to the event
@OnSubscribe({ 
  eventName: 'anEventName'
  type: 'SAME_NODE_PROCESS', 
})
private async onSubscribe(@Req() req: Request<{ foo: number, bar: string }>): Promise<void> {
  // 
}

// same as

@OnEvent('anEventName')
private async onEventMethod(@Req() req: Request<{ foo: number, bar: string }>) {
  // ...
}

```

`Equivalent to 'JS'`

```typescript
this.after('READ', MyEntity, async (req, res) => {
  this.emit('anEventName', { foo: 11, bar: '22' });
});

this.on('anEventName', async (msg) => {
  // ...
});
```

`Example 2`

In this example we emit the event in same `node process` and `same service` and we subscribe to it, the only difference, is in this case we get the Event from the `@cds-models` folder

`Service Definition (CDS):`

```yml
// We declare an event into our Service
service CatalogService {
  event SendData : {
    foo : Integer;
    bar : String;
  }
}
```

`Emitting and subscribing:`

```ts
import { OnSubscribe, Req, AfterRead, Results, OnEvent } from '@dxfrontier/cds-ts-dispatcher';
import type { SubscriberType } from '@dxfrontier/cds-ts-dispatcher';

import { SendData } from '#cds-models/CatalogService'; // <== location of @cds-models can differ.

// Emitting the event
@AfterRead()
private async afterRead(
  @Req() req: Request,
  @Results() results: MyEntity[],
): Promise<void> {
  this.srv.emit('SendData', { foo: 11, bar: '22' });
}

// Receiving the event + data
@OnSubscribe({ 
  eventName: SendData
  type: 'SAME_NODE_PROCESS' 
})
private async onSubscribe(@Req() req: Request<SendData>): Promise<void> {
  // 
  // req.data.foo ...
  // req.data.bar ...
  // req.headers ...
  // ...
}

// same as

@OnEvent(SendData)
private async onEventMethod(@Req() req: Request<SendData>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('READ', MyEntity, async (req, res) => {
  this.emit('SendData', { foo: 11, bar: '22' });
});

this.on('SendData', async (msg) => {
  // ...
});
```

> [!NOTE] 
> The `SendData` was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

`Example 3` 


In this example we assume we have `2 node instances` and `2 services` and we use external messaging `Cross-Instance Messaging (Message Broker)`

`Emitter (Service 1 & node instance 1):`

```ts
import { Req, AfterRead, Results } from '@dxfrontier/cds-ts-dispatcher';
import cds from '@sap/cds';

@AfterRead()
private async afterRead(
  @Req() req: Request,
  @Results() results: MyEntity[],
): Promise<void> {

  const messaging = await cds.connect.to('messaging');
        messaging.emit('SendData', { foo: 11, bar: '22' });

}
```

`Equivalent to 'JS'`

```ts
this.after('READ', MyEntity, async (req, res) => {
  const messaging = await cds.connect.to('messaging');
        messaging.emit('SendData', { foo: 11, bar: '22' });
});
```

`Subscriber (Service 2 & Node instance 2):`

```ts

import { SendData } from '#cds-models/CatalogService'; // <== location of @cds-models can differ.
import { Messaging, OnSubscribe } from '@dxfrontier/cds-ts-dispatcher';
import type { SubscriberType } from '@dxfrontier/cds-ts-dispatcher';

// Receiving the event + data 
@OnSubscribe({
  eventName: SendData,
  type: 'MESSAGE_BROKER' 
})
private async onSubscribe(@Msg() msg: SubscriberType<SendData>): Promise<void> {
  // 
  // req.data.foo ...
  // req.data.bar ...
  // req.headers ...
  // ...
}
```

`Equivalent to 'JS'`

```ts
const messaging = await cds.connect.to('messaging');
      messaging.on(SendData, async (msg) => {
        // ...
      });
```

> [!IMPORTANT]
> To have the `msg` parameter typed you can use TypeScript type `SubscriberType<T>` where T can be a CDS event or any object

> [!TIP]
> When using `messaging (broker)` the decorator [@Msg](#msg) must be applied as the request is anonymous at this level.

`Example 4`

In this example we emit an event in `Service 1` & `node process 1`, and we attach from `Service 2` a subscribe to `Service 1` & `node process 1`, meaning that, when emit `SendData` the service `Service 2` will be notified and the `onSubscribe` method will be triggered which resides attached to `Service 1`.

`Emitter (Service 1 & node process 1):`

```ts
import { Req, AfterRead, Results } from '@dxfrontier/cds-ts-dispatcher';
import type { SubscriberType } from '@dxfrontier/cds-ts-dispatcher';

import { SendData } from '#cds-models/CatalogService'; // <== location of @cds-models can differ.

// Emitting the event
// This event resides in Service_1
@AfterRead()
private async afterRead(
  @Req() req: Request,
  @Results() results: MyEntity[],
): Promise<void> {
  this.srv.emit('SendData', { foo: 11, bar: '22' });
}
```

`Equivalent to 'JS'`

```ts
// This event resides in Service_1
this.after('READ', MyEntity, async (req, res) => {
  this.emit('SendData', { foo: 11, bar: '22' });
});
```

`Subscriber (Service 2 & node process 1):`

```ts

import { OnSubscribe, Req } from '@dxfrontier/cds-ts-dispatcher';

// Receiving the event + data
// This event resides in Service_2 but the subscribe will be attached to Service_1
 @OnSubscribe({
  eventName: 'SendData',
  type: 'SAME_NODE_PROCESS_DIFFERENT_SERVICE',
  externalService: 'Service_1'
})
private async onSubscribe(@Req() req: Request<SendData>): Promise<void> {
  // req.data.foo ...
  // req.data.bar ...
  // req.headers ...
  // ...
}
```

`Equivalent to 'JS'`

```ts
// This code resides in Service_2 but it is subscribed to Service_1
const Service_1 = cds.connect.to('Service_1');
      Service_1.on('SendData', (msg) => {
        //
      });
```

> [!TIP]
> You can find more info about SAP CAP messaging in the following url [SAP CAP Events and Messaging](https://cap.cloud.sap/docs/guides/messaging/).

> [!IMPORTANT]  
> Decorator `@OnSubscribe` should be used inside [@UnboundActions](#unboundactions) class, but not mandatory it can reside also in [@EntityHandler](#entityhandler) class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnError

**@OnError**()

Use `@OnError` decorator to register custom error handler.

Error handlers are invoked whenever an error occurs during event processing of all potential events and requests, and are used to augment or modify error messages, before they go out to clients.

`Example`

```typescript
import { OnError, Error, Req } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

@OnError()
private onError(@Error() err: Error, @Req() req: Request) { // sync func
  err.message = 'New message'
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('error', (err, req) => {
  err.message = 'New message';
  // ...
});
```

> [!IMPORTANT]  
> Decorator `@OnError` should be used inside [@UnboundActions](#unboundactions) class.

> [!CAUTION]
> OnError callback are expected to be a **`sync`** function, i.e., **`not async`**, not returning `Promises`.

> [!TIP]
> More info can be found at [SAP CAP Error](https://cap.cloud.sap/docs/node.js/core-services#srv-on-error)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnBoundAction

**@OnBoundAction**(`name` : CdsAction)

`Parameters`

- `name (CdsAction)` : Representing the `CDS action` defined in the `CDS file`.

`Example`

```typescript
import { OnBoundAction, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnBoundAction(MyEntity.actions.AnAction)
private async onActionMethod(@Req() req: ActionRequest<typeof MyEntity.actions.AnAction>, @Next() next: NextEvent): ActionReturn<typeof MyEntity.actions.AnAction> {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(MyEntity.actions.AnAction, MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnBoundAction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnBoundFunction

**@OnBoundFunction**(`name` : CdsFunction)

`Parameters`

- `name (CdsFunction)` : Representing the `CDS action` defined in the `CDS file`.

`Example`

```typescript
import { OnBoundFunction, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnBoundFunction(MyEntity.actions.AFunction)
private async onFunctionMethod(@Req() req: ActionRequest<typeof MyEntity.actions.AFunction>, @Next() next: NextEvent): ActionReturn<typeof MyEntity.actions.AFunction> {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on(MyEntity.actions.AFunction, MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnBoundFunction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnAll

**@OnAll**()

The `@OnAll` decorator is triggered whenever **_any CRUD (Create, Read, Update, Delete)_** event occurs, whether the entity is `active` or in `draft` mode.

`ACTIVE ENTITY`

For active entities, the `@OnAll` decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeCreate()](#beforecreate), [@AfterCreate()](#aftercreate), [@OnCreate()](#oncreate)
- `READ` [@BeforeRead()](#beforeread), [@AfterRead()](#afterread), [@OnRead()](#onread)
- `UPDATE` [@BeforeUpdate()](#beforeupdate), [@AfterUpdate()](#afterupdate), [@OnUpdate()](#onupdate)
- `DELETE` [@BeforeDelete()](#beforedelete), [@AfterDelete()](#afterdelete), [@OnDelete()](#ondelete)
- `BOUND ACTIONS` [@OnBoundAction()](#onboundaction)
- `BOUND FUNCTIONS` [@OnBoundFunction()](#onboundfunction)
  
`DRAFT`

For draft entities, the `@OnAll` decorator will be triggered when at least __one__ of the following events occurs:

- `CREATE` [@BeforeNewDraft()](#beforenewdraft), [@AfterNewDraft()](#afternewdraft), [@OnNewDraft()](#onnewdraft)
- `CANCEL` [@BeforeCancelDraft()](#beforecanceldraft), [@AfterCancelDraft()](#aftercanceldraft), [@OnCancelDraft()](#oncanceldraft)
- `EDIT` [@BeforeEditDraft()](#beforeeditdraft), [@AfterEditDraft()](#aftereditdraft), [@OnEditDraft()](#oneditdraft)
- `SAVE` [@BeforeSaveDraft()](#beforesavedraft), [@AfterSaveDraft()](#aftersavedraft), [@OnSaveDraft()](#onsavedraft)
- :heavy_plus_sign: All active entity [Before](#before), [After](#after), [On](#on) events which have a `Draft` variant.

> [!NOTE]
> Exception will be the following decorators [@OnEvent()](#onevent), [@OnError()](#onerror) and `UNBOUND ACTIONS` [@OnAction()](#onaction), `UNBOUND FUNCTIONS` [@OnFunction()](#onfunction) as these are bound to the service itself and not to an entity.

`Example 1`

In this example, the `@OnAll()` decorator of the `onAll` method is executed after any CRUD operation `(CREATE, READ, UPDATE, DELETE, BOUND ACTIONS, BOUND FUNCTIONS)` on the `MyEntity` entity. 

Since the class is annotated with `@EntityHandler(MyEntity)`, the decorator is scoped to this specific `entity`, meaning it will only be triggered for operations related to `MyEntity`.

```typescript
import { OnAll, Next, EntityHandler } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @OnAll()
  private async onAll(@Req() req: Request, @Next() next: NextEvent) {
    // ...
    return next();
  }
}
```

`Equivalent to 'JS'`

```typescript
this.on('*', MyEntity, async (req, next) => {
  // ...
});
```
`Example 2`

In this example, the `@OnAll()` decorator is used in a more generic way. Unlike `Example 1`, where it applies only to `MyEntity`, this setup ensures that `afterAll` is triggered for `all entities`. 

This means the method will execute before any CRUD operation on `any` `entity` handled within the class.


```typescript
import { OnAll, Next, EntityHandler, CDS_DISPATCHER } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(CDS_DISPATCHER.ALL_ENTITIES)
export class BookHandler {
  // ...
  constructor() {}
  // All events like @AfterRead, @BeforeRead, ... will be triggered based on 'MyEntity'

  @OnAll()
  private async onAll(@Req() req: Request, @Next() next: NextEvent) {
    // ...
    return next();
  }
}
```

`Equivalent to 'JS'`

```typescript
this.on('*', '*', async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnAll()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!TIP]
> If the entity has drafts enabled `@odata.draft.enabled: true`, the `@OnAll` decorator will still be triggered for draft events.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Method`-`draft entity`

##### `Before`

Use `@BeforeNewDraft(), @BeforeCancelDraft(), @BeforeEditDraft(), @BeforeSaveDraft(), @BeforeCreateDraft(), @BeforeReadDraft(), @BeforeUpdateDraft(), @BeforeDeleteDraft()` to register handlers to run before`.on`handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `Request`

###### @BeforeNewDraft

**@BeforeNewDraft**()

Use this decorator when you want to validate inputs before a new draft is created.

`Example`

```typescript
import { BeforeNewDraft, Request } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeNewDraft()
private async beforeCreateDraftMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('NEW', MyEntity.drafts, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeCancelDraft

**@BeforeCancelDraft**()

Use this decorator when you want to validate inputs before a draft is discarded.

`Example`

```typescript
import { BeforeCancelDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCancelDraft()
private async beforeCancelDraftMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('CANCEL', MyEntity.drafts, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeEditDraft

**@BeforeEditDraft**()

Use this decorator when you want to validate inputs when a new draft is created from an active instance.

`Example`

```typescript
import { BeforeEditDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeEditDraft()
private async beforeEditDraftMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('EDIT', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeSaveDraft

**@BeforeSaveDraft**()

Use this decorator when you want to validate inputs when active entity is changed.

`Example`

```typescript
import { BeforeSaveDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeSaveDraft()
private async beforeSaveDraftMethod(@Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.before('SAVE', MyEntity, async (req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@BeforeSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `After`

Use `@AfterNewDraft(), @AfterCancelDraft(), @AfterEditDraft(), @AfterSaveDraft(), @AfterCreateDraft(), @AfterReadDraft(), @AfterUpdateDraft(), @AfterDeleteDraft()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.` The handlers receive two arguments:

The results from the preceding `.on` handler, with the following types:

| Parameters     | Decorator                         | Description                                                                |
| -------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `results, req` | `@AfterRead`                      | An array of type `MyEntity[]` and the `Request`.                           |
|                |                                   |                                                                            |
| `result, req`  | `@AfterUpdate`<br> `@AfterCreate` | An object of type `MyEntity` and the `Request`.                            |
|                |                                   |                                                                            |
| `deleted, req` | `@AfterDelete`                    | A `boolean` indicating whether the instance was deleted and the `Request`. |

###### @AfterNewDraft

**@AfterNewDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created.

`Example`

```typescript
import { AfterNewDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterNewDraft()
private async afterNewDraftMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('NEW', MyEntity.drafts, async (results, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterCancelDraft

**@AfterCancelDraft**()

Use this decorator when you want to enhance outbound data when a draft is discarded.

`Example`

```typescript
import { AfterCancelDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCancelDraft()
private async afterCancelDraftMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('CANCEL', MyEntity.drafts, async (results, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterEditDraft

**@AfterEditDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created from an active instance.

`Example`

```typescript
import { AfterEditDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterEditDraft()
private async afterEditDraftMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('EDIT', MyEntity, async (results, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterSaveDraft

**@AfterSaveDraft**()

Use this decorator when you want to enhance outbound data when the active entity is changed.

`Example`

```typescript
import { AfterSaveDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterSaveDraft()
private async afterSaveDraftMethod(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.after('SAVE', MyEntity, async (results, req) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@AfterSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `On`

Use [@OnNewDraft()](#onnewdraft), [@OnCancelDraft()](#oncanceldraft), [@OnSaveDraft()](#onsavedraft), [@OnEditDraft()](#oneditdraft), @OnReadDraft(), @OnUpdateDraft(), @OnCreateDraft(), @OnDeleteDraft(), @OnBoundActionDraft(), @OnBoundFunctionDraft() handlers to support for both, active and draft entities.

The handlers receive two arguments:

- `req` of type `Request`
- `next` of type `NextEvent`

See Official SAP **[Fiori-draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)**

###### @OnNewDraft

**@OnNewDraft()**

This decorator will be triggered when `a new draft is created`.

`Example`

```typescript
import { OnNewDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnNewDraft()
private async onNewDraft(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('NEW', MyEntity.drafts, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnCancelDraft

**@OnCancelDraft()**

This decorator will be triggered when `a draft is cancelled`.

`Example`

```typescript
import { OnCancelDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCancelDraft()
private async onCancelDraft(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('CANCEL', MyEntity.drafts, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnEditDraft

**@OnEditDraft()**

This decorator will be triggered when `a new draft is created from an active instance`

`Example`

```typescript
import { OnEditDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnEditDraft()
private async onEditDraft(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('EDIT', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnSaveDraft

**@OnSaveDraft()**

This decorator will be triggered when `the active entity is changed`

`Example`

```typescript

import { OnSaveDraft, Req, Next  } from "@dxfrontier/cds-ts-dispatcher";
import type { Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnSaveDraft()
private async onSaveDraft(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('SAVE', MyEntity, async (req, next) => {
  // ...
});
```

> [!IMPORTANT]
> Decorator `@OnSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `Other draft decorators`

All active entity [On](#on), [Before](#before), [After](#after) events have also a `Draft` variant.

> [!NOTE]
> Except the [@OnAction()](#onaction), [@OnFunction()](#onfunction), [@OnEvent()](#onevent), [@OnError()](#onerror) as these actions are bound to the service and not to an entity.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Method`-`helpers`

##### @AfterReadSingleInstance

**@AfterReadSingleInstance**()

The `@AfterReadSingleInstance` decorator is utilized as a method-level and it can be used when you want to execute custom logic for single instance request.

If you want to execute logic for both cases (single instance and entity set) then you should use the [@AfterRead()](#afterread) and applying the [@SingleInstanceSwitch()](#singleinstanceswitch) decorator to switch between entity set and single instance.

`Example`

Single request : `http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`

```typescript
import { AfterReadSingleInstance, Result, Req } from "@dxfrontier/cds-ts-dispatcher";
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterReadSingleInstance()
private async afterReadSingleInstance(@Result() result: MyEntity, @Req() req: Request<MyEntity>) {
  // This will be executed only when single instance is called : http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)
  // ...
}
```

> [!CAUTION]
> If [@AfterReadSingleInstance()](#afterreadsingleinstance) is used all together with [@AfterRead()](#afterread), the event `GET (Read), PATCH (Update)` will trigger both decorators, this applies only when both decorators are used in the same [@EntityHandler()](#entityhandler).
>
> The vice-versa doesn't apply, this means that if you trigger the entity set request the [@AfterReadSingleInstance()](#afterreadsingleinstance) will not be triggered.
>
> Example `GET`: <http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)>
>
> ```ts
> // use this
> @AfterReadSingleInstance()
> private async afterReadSingleInstance(
>   @Req() req: Request,
>   @Result() result: MyEntity
> ): Promise<void> {
>   // The `GET` will trigger the single instance request
> }
>
> // or this as alternative to above `@AfterReadSingleInstance`
> @AfterRead()
> private async afterRead(
>   @Req() req: Request,
>   @Results() results: MyEntity[],
>   @SingleInstanceSwitch() singleInstance: boolean
> ): Promise<void> {
>   // The `GET` will trigger for both cases (single instance & entity instance), but you can use the `singleInstance` flag to verify if it's single or entity set.
>   if(singleInstance) {
>  
>   }
> }
> ```

> [!IMPORTANT]
> Decorator [@AfterReadSingleInstance()](#afterreadsingleinstance) will be triggered based on the [EntityHandler](#entityhandler) `argument` `MyEntity`.

> [!TIP]
> If `@odata.draft.enabled: true` and you need to read the draft then you should use `@AfterReadDraftSingleInstance()` decorator.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Prepend

**@Prepend({ eventDecorator : string })**

The `@Prepend` decorator is utilized as a `method-level` decorator to register an event handler to run before existing ones like [@BeforeCreate()](#beforecreate) [@AfterCreate()](#aftercreate) [@OnAction()](#onaction) ..., etc.

`Parameters`

- `eventDecorator (string)` : The eventDecorator can be one of the following :
  - `BEFORE`: `'BeforeCreate'`, `'BeforeRead'`, `'BeforeUpdate'`, `'BeforeDelete'`, `'BeforeAll'`.
  - `AFTER`: `'AfterCreate'`, `'AfterRead'`, `'AfterReadEachInstance'`, `'AfterReadSingleInstance'`, `'AfterUpdate'`, `'AfterDelete'`, `'AfterAll'`.
  - `ON:` `'OnCreate'`, `'OnRead'`, `'OnUpdate'`, `'OnDelete'`, `'OnAll'`, `'OnAction'`, `'OnFunction'`, `'OnBoundAction'`, `'OnBoundFunction'`, `'OnEvent'`, `'OnError'`.
- `actionName: (CDSFunction)` : Action name, applicable only for `OnAction`, `OnBoundAction`, `OnFunction`, `OnBoundFunction`.
- `eventName: (CDSEvent)` : Event name, applicable only for `OnEvent`.

`Example 1`

```typescript
import { Prepend, AfterRead, Req, Results } from '@dxfrontier/cds-ts-dispatcher';
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@Prepend({ eventDecorator: 'AfterRead' })
private async prepend(@Req() req: Request): Promise<void> {
  req.locale = 'DE_de';
}

@AfterRead()
private async afterRead(MyEntity
  @Req() req: Request,
  @Results() results: MyEntity[],
) {

  // req.locale will have the value 'DE_de' ...
  // ...
}
```

`Example 2`

```typescript
import { Prepend, OnEvent, Req } from '@dxfrontier/cds-ts-dispatcher';
import type { Request } from '@dxfrontier/cds-ts-dispatcher';

import { MyEvent } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@Prepend({ eventDecorator: 'OnEvent', eventName: MyEvent })
private async prepend(@Req() req: Request<MyEvent>) {
  req.locale = 'DE_de';
}

@OnEvent(MyEvent)
public async handleMyEvent(@Req() req: Request<MyEvent>) {
  // req.locale will have the value 'DE_de' ...
  // ...
}
```

> [!TIP]
> The `@Prepend` decorator can be used for example :
>
> - When you want to prepare various things `before` reaching the actual event.
> - Making transformation on `Request`, `Result`, ... `before` reaching the actual event.
> - ...

> [!TIP]
> If `@odata.draft.enabled: true` and you need to read the draft then you should use `@PrependDraft()` decorator.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Validate

**@Validate\<T\>({ action, options? }, ...fields: Array\<keyof T>)**

The `@Validate` decorator is utilized as a `method-level` decorator, used to validate `fields` of your entity before reaching your event callback.

> [!TIP]
> Think of it as a `pre-validation` helper.

The `@Validate` decorator is useful when you need to `validate` the `Request`.`data` _(Request Body)_ of the `@sap/cds - Request` object in the following contexts:

- `ON`
  - [@OnCreate()](#oncreate)
  - [@OnUpdate()](#onupdate)
  - [@OnAction()](#onaction)
  - [@OnBoundAction()](#onboundaction)
  - [@OnFunction()](#onfunction)
  - [@OnBoundFunction()](#onboundfunction)
- `BEFORE`
  - [@BeforeCreate()](#beforecreate)
  - [@BeforeUpdate()](#beforeupdate)

`Parameters`

- <span style="color:#32CD32">**action**</span>: Choose from a list of predefined <span style="color:#32CD32"> **Validators** </span>.
- <span style="color:#FF8C00">**options**?</span>: _[Optional]_ Additional options for customizing the validation process.

  The `options` parameter accepts the following settings to customize validation behavior:

  - **`exposeValidatorResult`** (boolean):  
    Determines if the validator results are captured and passed to the method as parameters.

    - If `true`, the validator results (e.g., `ValidatorFlags<'endsWith' | 'isEmail'>`) will be available as a parameter in the method.
    - To use this, apply the `@ValidationResults` decorator to the method parameter where you want the validator flags injected.

    **Default:** `false`

    **Example:**

    ```typescript
    @Validate<MyEntity>({ action: 'endsWith', target: 'N', exposeValidatorResult: true }, 'description')
    @Validate<MyEntity>({ action: 'isEmail', exposeValidatorResult: true }, 'description')
    public async beforeCreate(
      @Req() req: Request<MyEntity>,
      @ValidationResults() validator: ValidatorFlags<'endsWith' | 'isEmail'>,
    ) {
      if (validator.endsWith) {
        // logic based on validation result endsWith
      }

      if (validator.isEmail) {
        // logic based on validation result isEmail
      }
    }
    ```

  - **`customMessage`** (string):  
    Custom message to replace the default validation error message.

    - If provided, this message will be shown instead of the default error.

  - **`mandatoryFieldValidation`** (boolean):  
    Controls whether the validator requires the presence of the fields in `Request.data`.

    - If `true`, the specified fields must be present in `Request.data`, or validation will fail.
    - If `false` (or omitted), validation will pass even if the field is missing.

    **Default:** `false`

- <span style="color:#32CD32">**...fields**</span>: Specify the fields of your entity that require validation.

`Returns`

The decorator will raise a `Request.reject` message if the validation requirements are not met.

<span style="color:#32CD32"> **Validators** </span>

Below is a list of available validators:

| Action           | Description                                                                                              | Options                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contains         | Check if the string contains the seed.                                                                   | **ignoreCase**: boolean \| undefined; _default : false_ <br /> **minOccurrences**: number \| undefined; _default 1_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| equals           | Check if the string matches the comparison.                                                              |
| matches          | Check if the string matches the pattern.                                                                 |
| startsWith       | Checks if the string starts with the given `target` string.                                              |
| endsWith         | Checks if the string ends with the given `target` string.                                                |
| isMailtoURI      | Check if the string is a Mailto URI format.                                                              | **allow_display_name:** If set to `true`, the validator will also match `Display Name <email-address>`. _Default: false_ <br> **require_display_name:** If set to `true`, the validator will reject strings without the format `Display Name <email-address>`. _Default: false_ <br> **allow_utf8_local_part:** If set to `false`, the validator will not allow any non-English UTF8 character in the email address' local part. _Default: true_ <br> **require_tld:** If set to `false`, email addresses without a TLD in their domain will also be matched. _Default: true_ <br> **ignore_max_length:** If set to `true`, the validator will not check for the standard max length of an email. _Default: false_ <br> **allow_ip_domain:** If set to `true`, the validator will allow IP addresses in the host part. _Default: false_ <br> **domain_specific_validation:** If set to `true`, some additional validation will be enabled, e.g., disallowing certain syntactically valid email addresses that are rejected by GMail. _Default: false_ <br> **host_blacklist:** An array of strings. If the part of the email after the `@` symbol matches any string in the array, validation fails. <br> **host_whitelist:** An array of strings. If the part of the email after the `@` symbol does not match any string in the array, validation fails. <br> **blacklisted_chars:** A string. If any character in the string appears in the name part of the email, validation fails.                                                                                                                                                                                                                                    |
| isNumeric        | Check if the string contains only numbers.                                                               | <p> <b>no_symbols:</b> If set to `true`, the validator will reject numeric strings that feature a symbol (e.g., `+`, `-`, or `.`). \_Default: false\* </p> <p> <b>locale:</b> An object specifying the locale information for alpha validation. </p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| isTime           | Check if the string is a valid time e.g. `23:01:59`.                                                     | <p> <b>hourFormat:</b> Specify the hour format to validate. Use `'hour12'` for 12-hour format and `'hour24'` for 24-hour format. _Default: 'hour24'_ </p> <p> <b>mode:</b> Specify the time format to validate. Use `'default'` for HH:MM format and `'withSeconds'` for HH:MM:SS format. _Default: 'default'_ </p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| isLatLong        | check if the string is a valid latitude-longitude coordinate in the format `lat,long` or `lat, long`.    |
| isMD5            | check if the string is a MD5 hash.                                                                       |
| isMimeType       | check if the string matches to a valid [MIME type] format.                                               |
| isPort           | check if the string is a valid port number.                                                              |
| isSlug           | check if the string is of type slug.                                                                     |
| isISBN           | check if the string is an [ISBN]                                                                         | <b> version: </b> "10", "13", 10, 13;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| isEmail          | check if the string is an email.                                                                         | Same as `isMailtoURI`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| isAlpha          | Check if the string contains only letters (a-zA-Z).                                                      |
| isAlphanumeric   | Check if the string contains only letters and numbers.                                                   |
| isCreditCard     | Check if the string is a credit card.                                                                    | <p> <b>provider:</b> Specify the credit card provider to validate. Use one of the following: `'amex'`, `'dinersclub'`, `'discover'`, `'jcb'`, `'mastercard'`, `'unionpay'`, `'visa'`, or `''` for any provider. _Default: undefined_ </p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| isCurrency       | Check if the string is a valid currency amount.                                                          | **symbol:** The currency symbol to be expected. _Default: '$'_ <br> **require_symbol:** If set to `true`, the validator will expect the currency symbol to be present. _Default: false_ <br> **allow_space_after_symbol:** If set to `true`, the validator will allow a space after the currency symbol. _Default: false_ <br> **symbol_after_digits:** If set to `true`, the currency symbol will be expected after the digits. _Default: false_ <br> **allow_negatives:** If set to `true`, negative currency values will be allowed. _Default: true_ <br> **parens_for_negatives:** If set to `true`, negative currency values will be enclosed in parentheses. _Default: false_ <br> **negative_sign_before_digits:** If set to `true`, the negative sign will be placed before the digits. _Default: false_ <br> **negative_sign_after_digits:** If set to `true`, the negative sign will be placed after the digits. _Default: false_ <br> **allow_negative_sign_placeholder:** If set to `true`, the validator will allow a placeholder `-` for negative values. _Default: false_ <br> **thousands_separator:** The thousands separator to be expected. _Default: ','_ <br> **decimal_separator:** The decimal separator to be expected. _Default: '.'_ <br> **allow_decimal:** If set to `true`, decimal values will be allowed. _Default: true_ <br> **require_decimal:** If set to `true`, a decimal value will be required. _Default: false_ <br> **digits_after_decimal:** An array of numbers representing the exact number of digits allowed after the decimal point. _Default: [2]_ <br> **allow_space_after_digits:** If set to `true`, the validator will allow a space after the digits. _Default: false_ |
| isDataURI        | Check if the string is a [data URI format](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs). |
| isDate           | Check if the string is a valid date.                                                                     | **format:** A string representing the expected date format. _Default: undefined_ <br> **strictMode:** If set to `true`, the validator will reject inputs different from the specified format. _Default: false_ <br> **delimiters:** An array of allowed date delimiters. _Default: ['/', '-']_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| isEmpty          | Check if the string has a length of zero.                                                                | **ignore_whitespace:** If set to `true`, whitespace characters will be ignored. _Default: false_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| isIBAN           | Check if a string is an IBAN.                                                                            | **whitelist**: An array of IBAN countries to whitelist. _Default: undefined_ <br> **blacklist**: An array of IBAN countries to blacklist. _Default: undefined_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| isIMEI           | Check if the string is a valid IMEI.                                                                     | **allow_hyphens**: If set to `true`, allows IMEI numbers with hyphens. _Default: false_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| isIP             | Check if the string is an IP (version 4 or 6).                                                           | `"4", "6", 4, 6;`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| isIdentityCard   | Check if the string is a valid identity card code.                                                       | **locale**: An array of supported locales for identity cards. Acceptable values: "ar-LY", "ar-TN", "ES", "FI", "he-IL", "IN", "IR", "IT", "LK", "NO", "PL", "TH", "zh-CN", "zh-HK", "zh-TW" or 'any'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| isIn             | Check if the string is in an array of allowed values.                                                    |
| isJSON           | Check if the string is valid JSON (note: uses `JSON.parse`).                                             |
| isJWT            | Check if the string is a valid JWT token.                                                                |
| isLength         | Check if the string's length falls in a range.                                                           | **min**: The minimum length allowed for the string. _Default: 0_ <br> **max**: The maximum length allowed for the string. _Default: undefined_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| isLowercase      | Check if the string is lowercase.                                                                        |
| isMobilePhone    | Check if the string is a mobile phone number.                                                            | **strictMode**: If set to `true`, the mobile phone number must be supplied with the country code and must start with `+`. _Default: false_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| isPassportNumber | Check if the string is a valid passport number relative to a specific country code.                      |
| isPostalCode     | Check if the string is a postal code.                                                                    | "AD", "AT", "AU", "BE", "BG", "BR", "CA", "CH", "CN", "CZ", "DE", "DK", "DZ", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "ID", "IE", "IL", "IN", "IR", "IS", "IT", "JP", "KE", "KR", "LI", "LT", "LU", "LV", "MX", "MT", "NL", "NO", "NZ", "PL", "PR", "PT", "RO", "RU", "SA", "SE", "SI", "SK", "TN", "TW", "UA", "US", "ZA", "ZM"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| isURL            | Check if the string is a URL.                                                                            | **protocols**: An array of allowed protocols. _Default: ['http', 'https', 'ftp']_ <br> **require_tld**: If set to `true`, URLs must have a top-level domain. _Default: true_ <br> **require_protocol**: If set to `true`, URLs must have a protocol. _Default: false_ <br> **require_host**: If set to `true`, URLs must have a host. _Default: true_ <br> **require_port**: If set to `true`, isURL will check if a port is present in the URL. _Default: false_ <br> **require_valid_protocol**: If set to `true`, URLs must have a valid protocol. _Default: true_ <br> **allow_underscores**: If set to `true`, underscores are allowed in URLs. _Default: false_ <br> **host_whitelist**: An array of allowed hosts. <br> **host_blacklist**: An array of disallowed hosts. <br> **allow_trailing_dot**: If set to `true`, trailing dots are allowed in URLs. _Default: false_ <br> **allow_protocol_relative_urls**: If set to `true`, protocol-relative URLs are allowed. _Default: false_ <br> **disallow_auth**: If set to `true`, authentication credentials in URLs are disallowed. _Default: false_ <br> **allow_fragments**: If set to `true`, URL fragments are allowed. _Default: true_ <br> **allow_query_components**: If set to `true`, URL query components are allowed. _Default: true_ <br> **validate_length**: If set to `true`, URLs will be validated for length. _Default: true_                                                                                                                                                                                                                                                                                                                  |
| isUUID           | Check if the string is a UUID (version 1, 2, 3, 4, or 5).                                                |
| isUppercase      | Check if the string is uppercase.                                                                        |
| isVAT            | Checks that the string is a valid VAT number.                                                            |
| isWhitelisted    | Checks if characters appear in the whitelist.                                                            |
| isInt            | Check if the string is an integer.                                                                       | **min**: to check the integer min boundary <br> **max**: to check the integer max boundary <br> **allow_leading_zeroes**: if `false`, will disallow integer values with leading zeroes. _Default: true_ <br> **lt**: enforce integers being greater than the value provided <br> **gt**: enforce integers being less than the value provided                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| isHexadecimal    | Check if the string is a hexadecimal number.                                                             |
| isFloat          | Check if the string is a float.                                                                          | **min**: less or equal <br> **max**: greater or equal <br> **gt**: greater than <br> **lt**: less than <br> **locale**: FloatLocale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| isHash           | Check if the string is a hash of export type algorithm.                                                  | "md4", "md5", "sha1", "sha256", "sha384", "sha512", "ripemd128", "ripemd160", "tiger128", "tiger160", "tiger192", "crc32", "crc32b"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| isEAN            | Check if the string is an EAN (European Article Number).                                                 |
| isDecimal        | Check if the string represents a decimal number, such as `0.1`, `.3`, `1.1`, `1.00003`, `4.0` etc.       | **force_decimal**: If set to `true`, the validator will only return `true` if the string contains a decimal number. _Default: false_ <br> **decimal_digits**: Specifies the number of decimal digits allowed. It can be given as a range like `'1,3'`, a specific value like `'3'`, or min like `'1,'`. _Default: '1,'_ <br> **locale**: The locale to use for number formatting. _Default: 'en-US'_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| isBoolean        | Check if a string is a boolean.                                                                          | **loose**: If set to `true`, the validator will match a valid boolean string of any case, including ['true', 'True', 'TRUE'], and also 'yes' and 'no'. If set to `false`, the validator will strictly match ['true', 'false', '0', '1']. _Default: false_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| isBIC            | Check if a string is a BIC (Bank Identification Code) or SWIFT code.                                     |
| isBefore         | Check if the string is a date that's before the specified date.                                          |
| isAfter          | Check if the string is a date that's after the specified date.                                           |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

`Example 1`

```typescript
import {
  EntityHandler,
  Inject,
  CDS_DISPATCHER,
  Validate,
  BeforeCreate,
  BeforeUpdate,
  OnCreate,
  OnUpdate,
  Req,
  Next,
} from '@dxfrontier/cds-ts-dispatcher';
import type { Request, Service, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(CDS_DISPATCHER.SRV) private srv: Service;
  // ...
  constructor() {}

  @BeforeCreate()
  @Validate<MyEntity>({ action: 'isLowercase' }, 'comment')
  @Validate<MyEntity>({ action: 'endsWith', target: 'N' }, 'description')
  private async beforeCreate(@Req() req: Request<MyEntity>) {
    // ...
  }

  @BeforeUpdate()
  @Validate<MyEntity>({ action: 'startsWith', target: 'COMMENT:' }, 'comment')
  @Validate<MyEntity>({ action: 'isAlphanumeric' }, 'description')
  private async beforeUpdate(@Req() req: Request<MyEntity>) {
    // ...
  }

  @OnCreate()
  @Validate<MyEntity>({ action: 'isAlphanumeric' }, 'book_ID')
  private async onCreate(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  @OnUpdate()
  @Validate<MyEntity>({ action: 'isLength', options: { min: 5 } }, 'comment')
  private async onUpdate(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  // ...
}
```

`Example 2`: `@Validate` is used inside of `@UnboundActions`

```ts
import { UnboundActions, OnAction, OnFunction, OnEvent, Validate, Next, Req } from '@dxfrontier/cds-ts-dispatcher';
import type { ExposeFields, Request, ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { SomeAction, SomeFunction, OrderedBook } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@UnboundActions()
class UnboundActionsHandler {
  @OnAction(SomeAction)
  @Validate<ExposeFields<typeof SomeAction>>({ action: 'isIn', values: [1, 2] }, 'book', 'quantity')
  private async onActionMethod(
    @Req() req: ActionRequest<typeof SomeAction>,
    @Next() _: NextEvent,
  ): ActionReturn<typeof SomeAction> {
    // ...
  }

  @OnFunction(SomeFunction)
  @Validate<ExposeFields<typeof SomeFunction>>({ action: 'isIn', values: [1, 2] }, 'book', 'quantity')
  private async onFunctionMethod(
    @Req() req: ActionRequest<typeof SomeFunction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof SomeFunction> {
    // ...
  }

  @OnEvent(OrderedBook)
  @Validate<OrderedBook>({ action: 'isIn', values: [1, 2] }, 'book', 'quantity')
  private async onEvent(@Req() req: Request<OrderedBook>) {
    // ...
  }
}
```

> [!TIP]
> If you want to catch the validators use the following decorator [@ValidationResults](#validationresults)
>
> This approach is useful if you need to conditionally process data based on validation outcomes within the same function.
>
> **Example Use Case**: Suppose you want to validate multiple fields but only perform certain actions when specific validations pass. By using `@ValidationResults`, you `gain access` to a detailed `validator object` containing the `results` for each validation, allowing for flexible and targeted logic.

> ```ts
>  @Validate<MyEntity>({ action: 'isLowercase', exposeValidatorResult: true }, 'comment')
>  @Validate<MyEntity>({ action: 'endsWith', target: 'N', exposeValidatorResult: true }, 'description')
>public async beforeCreate(
>  @Req() req: Request<MyEntity>,
>  @ValidationResults() validator: ValidatorFlags<'isLowercase' | 'endsWith'>) {
>  // Conditional handling based on validation flags
>  if (validator.isLowercase) {
>    // Execute logic when the "isLowercase" validation succeeds
>  }
>
>  if (validator.endsWith) {
>    // Separate handling for "endsWith" validation result
>  }
>}
> ```

> [!IMPORTANT]
> To get the fields for
>
> - [@OnAction](#onaction)
> - [@OnBoundAction](#onboundaction)
> - [@OnFunction](#onfunction)
> - [@OnBoundFunction](#onboundfunction)
>
> you must use the `ExposeFields` type inside of the `@Validate` decorator.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @FieldsFormatter

**@FieldsFormatter\<T\>({ action, options? }, ...fields: Array\<keyof T>)**

The `@FieldsFormatter` is used as a `method` decorator to `modify`/`enhance` fields.

The `@FieldsFormatter` decorator can be used on the following decorators :

1. When you want to `modify`/`enhance` the `results` of your callback.

   - `AFTER`
     - [@AfterRead()](#afterread)

2. When you want to `modify`/`enhance` the `Request`.`data` _(Request Body)_ of the `@sap/cds - Request` object.

   - `ON`
     - [@OnCreate()](#oncreate)
     - [@OnUpdate()](#onupdate)
     - [@OnAction()](#onaction)
     - [@OnBoundAction()](#onboundaction)
     - [@OnFunction()](#onfunction)
     - [@OnBoundFunction()](#onboundfunction)
   - `BEFORE`
     - [@BeforeCreate()](#beforecreate)
     - [@BeforeUpdate()](#beforeupdate)

`Parameters`

- `action`: Choose from a list of predefined `Formatters`.
- `options?`: [Optional] Additional options for customizing the formatter process.
- `...fields`: Specify the fields of your entity that require formatting.

`Formatters`

Here are the available formatter methods:

| Action          | Description                                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| blacklist       | Remove characters that appear in the blacklist.                                                                                                                                                                                                                            |
| ltrim           | Trim characters from the left-side of the input.                                                                                                                                                                                                                           |
| rtrim           | Trim characters from the right-side of the input.                                                                                                                                                                                                                          |
| trim            | Trim characters from both sides of the input.                                                                                                                                                                                                                              |
| escape          | Replace `<`, `>`, `&`, `'`, `"` and `/` with HTML entities.                                                                                                                                                                                                                |
| unescape        | Replaces HTML encoded entities with `<`, `>`, `&`, `'`, `"` and `/`.                                                                                                                                                                                                       |
| toLower         | Converts string, as a whole, to lower case.                                                                                                                                                                                                                                |
| toUpper         | Converts string, as a whole, to upper case.                                                                                                                                                                                                                                |
| upperFirst      | Converts the first character of the string to upper case.                                                                                                                                                                                                                  |
| lowerFirst      | Converts the first character of the string to lower case.                                                                                                                                                                                                                  |
| replace         | Replaces matches for pattern in string with replacement. <br /> **Note**: This method is based on String#replace.                                                                                                                                                          |
| truncate        | Truncates string if it’s longer than the given maximum string length. <br /> The last characters of the truncated, string are replaced with the omission string which defaults to "…".                                                                                     |
| snakeCase       | Snake case (or snake*case) is the process of writing compound words so that the words are separated with an underscore symbol (*) instead of a space. The first letter is usually changed to lowercase. Some examples of Snake case would be `"foo_bar" or "hello_world".` |
| kebabCase       | Kebab case, also known as "spinal case" or "hyphen case," involves writing compound words in lowercase letters and separating them with hyphens ("-"). For example, the phrase "user settings panel" would be represented as `"user-settings-panel"` in the kebab case.    |
| camelCase       | The format indicates the first word starting with either case, then the following words having an initial uppercase letter. `CustomerName, LastName ...`                                                                                                                   |
| customFormatter | Apply a custom formatter when standard ones do not satisfy your needs.                                                                                                                                                                                                     |

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

`Example 1`

```typescript
import {
  EntityHandler,
  Inject,
  CDS_DISPATCHER,
  BeforeCreate,
  BeforeUpdate,
  AfterRead,
  OnCreate,
  OnUpdate,
  FieldsFormatter,
  Req,
  Next,
} from '@dxfrontier/cds-ts-dispatcher';
import type { Service, Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(CDS_DISPATCHER.SRV) private srv: Service;
  // ...
  constructor() {}

  @BeforeCreate()
  @FieldsFormatter<MyEntity>({ action: 'blacklist', charsToRemove: 'le' }, 'name')
  private async beforeCreate(@Req() req: Request<MyEntity>) {
    // ...
  }

  @BeforeUpdate()
  @FieldsFormatter<MyEntity>({ action: 'truncate', options: { length: 7 } }, 'comment')
  private async beforeUpdate(@Req() req: Request<MyEntity>) {
    // ...
  }

  @AfterRead()
  @FieldsFormatter<MyEntity>({ action: 'toUpper' }, 'lastName')
  @FieldsFormatter<MyEntity>(
    {
      action: 'customFormatter',
      callback(req, results) {
        if (results) {
          // make first item 'toLowerCase' and leave the rest 'toUpper'
          results[0].lastName = results[0].lastName?.toLowerCase();
        }
      },
    },
    'lastName',
  )
  private async afterRead(@Results() results: MyEntity[], @Req() req: Request<MyEntity>) {
    // ...
  }

  @OnCreate()
  @FieldsFormatter<MyEntity>({ action: 'ltrim' }, 'language')
  private async onCreate(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<MyEntity>({ action: 'trim' }, 'format')
  private async onUpdate(@Req() req: Request<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  // ...
}
```

> [!TIP]
> See best practice for [customFormatter](#best-practices-tips)

`Example 2` : using `@FieldsFormatter` decorator inside the [@UnboundActions](#unboundactions)

```ts
import {
  UnboundActions,
  OnAction,
  OnFunction,
  OnEvent,
  FieldsFormatter,
  Req,
  Next,
} from '@dxfrontier/cds-ts-dispatcher';
import type { ActionRequest, ActionReturn, ExposeFields, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@UnboundActions()
class UnboundActionsHandler {
  @OnAction(AnAction)
  @FieldsFormatter<ExposeFields<typeof AnAction>>({ action: 'toLower' }, 'descr', 'bookName')
  private async onActionMethod(
    @Req() req: ActionRequest<typeof AnAction>,
    @Next() _: NextEvent,
  ): ActionReturn<typeof AnAction> {
    // ...
    return next();
  }

  @OnFunction(AFunction)
  @FieldsFormatter<ExposeFields<typeof AFunction>>({ action: 'toUpper' }, 'lastName')
  private async onFunctionMethod(
    @Req() req: ActionRequest<typeof AFunction>,
    @Next() next: NextEvent,
  ): ActionReturn<typeof AFunction> {
    // ...
    return next();
  }

  @OnEvent(AnEvent)
  @FieldsFormatter<AnEvent>({ action: 'upperFirst' }, 'name')
  private async onEvent(@Req() req: Request<AnEvent>) {
    // ...
  }
}
```

> [!IMPORTANT]
> To get the fields for
>
> - [@OnAction()](#onaction)
> - [@OnBoundAction()](#onboundaction)
> - [@OnFunction()](#onfunction)
> - [@OnBoundFunction()](#onboundfunction)
>
> you must use the `ExposeFields type` inside of the `@FieldsFormatter` decorator.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @ExecutionAllowedForRole

**@ExecutionAllowedForRole(...roles: string[])**

The `@ExecutionAllowedForRole` is used as a `method` decorator and was designed to enforce `role-based access control`, ensuring that only users with `specific roles` are authorized to execute the event.

It applies an logical `OR` on the specified **_roles_**, meaning it checks if at `least one` of the specified roles is assigned to the current request, then the execution will be allowed.

`Parameters`

- `...roles: string[]`: Specifies the roles that are permitted to execute the event logic.

`Example`

```typescript
@AfterRead()
@ExecutionAllowedForRole('Manager', 'User', 'CEO')
private async afterRead(
  @Req() req: Request,
  @Results() results: BookSale[],
) {
  // Method implementation
  // Code will be executed only in case of User ( Manager, User and CEO )
}
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Use

**@Use**(`...Middleware[]`)

The `@Use` decorator is utilized as a `method-level` decorator and allows you to inject middlewares into your method.

Middleware decorators can perform the following tasks:

- Execute any code.
- Make changes to the request object.
- End the request-response cycle.
- Call the next middleware function in the stack.
- If the current middleware function does not end the request-response cycle, it must call `next()` to pass control to the next middleware function. Otherwise, the request will be left hanging.

`Parameters`

- `...Middleware[])`: Middleware classes to be injected.

`Example:` middleware implementation:

```typescript
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareClass implements MiddlewareImpl {
  public async use(req: Request, next: NextMiddleware) {
    console.log('Middleware use method called.');

    await next();
  }
}
```

> [!TIP]
>
> Inside of the `use` method you can use [@CatchAndSetErrorCode](#catchandseterrorcode) and [@CatchAndSetErrorMessage](#catchandseterrormessage) decorators if you want to catch errors.


`Example` usage:

```typescript
import { EntityHandler, Use, Inject, CDS_DISPATCHER } from '@dxfrontier/cds-ts-dispatcher';
import type { Service, Request } from '@dxfrontier/cds-ts-dispatcher';

import { MiddlewareClass } from 'YOUR_MIDDLEWARE_LOCATION';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(CDS_DISPATCHER.SRV) private srv: Service;
  // ...
  constructor() {}

  @AfterRead()
  @Use(MiddlewareClass)
  private async aMethod(@Results() results: MyEntity[], @Req() req: Request) {
    // ...
  }

  // ...
}
```

> [!TIP]
>
> 1. Middlewares when applied with `@Use` are executed before the normal events.
> 2. If you need to apply middleware to `class` you can have a look over class specific [@Use](#use) decorator .

> 
> [!WARNING]
> If `req.reject()` is being used inside of middleware this will stop the stack of middlewares, this means that next middleware will not be executed.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @CatchAndSetErrorCode

**@CatchAndSetErrorCode(newStatusCode: string)**

The `@CatchAndSetErrorCode` decorator is a `method` decorator that automatically `catches errors` and assigns a new `status code` to the response. It eliminates the need for `explicit try-catch` blocks within the method, ensuring consistent error handling across your service.

`Parameters`

- `newStatusCode` - The status code to return when an error occurs, replacing the original error code.

`Example 1`

In the example below, we call a web service `(await axios.get('https://jsonplaceholder.typicode'))` which always throws a `500 Internal Server Error`, by using `@CatchAndSetErrorCode('BAD_REQUEST-400')`, we overwrite the default `500 Internal Server Error` with `400 Bad Request`.

```typescript
@AfterRead()
@CatchAndSetErrorCode('BAD_REQUEST-400') // <== Catch all errors and overwrite with `BAD REQUEST 400`
private async afterRead(
  @Req() req: Request,
  @Results() results: Book[],
): Promise<void> {

  // No need to wrap the service with a try-catch
  await axios.get('https://jsonplaceholder.typicode'); // <== Throw 500 Internal Server Error
}
```

`Example 2`

In the example below, we stack 2 decorators
- `@CatchAndSetErrorCode`
- `@CatchAndSetErrorMessage`

as a result the second `@CatchAndSetErrorMessage` decorator will not be executed due to the stop of execution of the first `@CatchAndSetErrorCode` decorator




```typescript
@AfterRead()
@CatchAndSetErrorCode('BAD_REQUEST-400') // <== Catch all errors and overwrite with `BAD REQUEST 400`
@CatchAndSetErrorMessage('The new message of the error') // <== This will not be executed !!
private async afterRead(
  @Req() req: Request,
  @Results() results: Book[],
): Promise<void> {

  // No need to wrap the service with a try-catch.
  await axios.get('https://jsonplaceholder.typicode'); // <== This service will throw a 500 Internal Server Error
}
```

`Example 3`

In this example we added `@CatchAndSetErrorCode` decorator to throw a new custom message to the [`use` method of @Use](#use-1) middleware.


```typescript
import { CatchAndSetErrorCode } from '@dxfrontier/cds-ts-dispatcher';
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher'

import type { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

export class Middleware1 implements MiddlewareImpl {
  @CatchAndSetErrorCode('New error message')
  public async use(req: Request<MyEntity>, next: NextMiddleware): Promise<void> {
    // ...
    await next();
  }
}
```
then use it inside of `MyHandler` class

```typescript
import { EntityHandler, Use, AfterRead, Results, Req, Request} from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';
import { Middleware1 } from 'YOUR_MIDDLEWARE_LOCATION';

@EntityHandler(MyEntity)
@Use(Middleware1) // <== Add Middleware1 
export class MyHandler {
  // ...
  constructor() {}

  @AfterRead()
  @Use(Middleware1) // <== Or use it as method middleware
  private async aMethod(@Results() results: MyEntity[], @Req() req: Request) {
    // ...
  }
}
```

> [!TIP]
> Decorators [`@CatchAndSetErrorCode`](#catchandseterrorcode) and [`@CatchAndSetErrorMessage`](#catchandseterrormessage) can be used in [`use` method of @Use](#use-1) middleware and class [`use` method of @Use](#use) middleware.

> [!TIP]
> Always stack [`@CatchAndSetErrorCode`](#catchandseterrorcode) and [`@CatchAndSetErrorMessage`](#catchandseterrormessage) decorators `last` `(at the bottom of the of the method)` so that other decorators are executed. 

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @CatchAndSetErrorMessage


**CatchAndSetErrorMessage(newMessage: string, newStatusCode?: keyof StatusCodeMapping)**

The `@CatchAndSetErrorMessage` decorator is a `method` decorator that automatically `catches errors` and assigns a new `message` and a new `error code` to the response. It eliminates the need for `explicit try-catch` blocks within the method, ensuring consistent error handling across your service.

`Parameters`

- `newMessage` - The message to return when an error occurs, placing the original error message.
- `newStatusCode?` `[optional]` - The status code to return when an error occurs, replacing the original error code.

`Example 1`

In this example, we fetch user data from an `external API`. If the API call fails, we replace the error message and return a `404 Not Found response`.

```typescript
import { Req, CatchAndSetErrorMessage, OnUpdate } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnUpdate()
@CatchAndSetErrorMessage('User data could not be retrieved', 'NOT_FOUND-404') 
private async onUpdate(@Req() req: Request<MyEntity>): Promise<MyEntity> {
  const userId = req.data.ID;
  
  const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${userId}`); // <=== No need to explicitly catch in a try-catch statement, @CatchAndSetErrorMessage will take care of that.
}
```

`Example 2`

In this example we added `@CatchAndSetErrorMessage` decorator to throw a new custom message to the [@Use - method](#use-1) of a middleware.


```typescript
import { CatchAndSetErrorMessage } from '@dxfrontier/cds-ts-dispatcher';
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher'

import type { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

export class Middleware1 implements MiddlewareImpl {
  @CatchAndSetErrorMessage('New error message')
  public async use(req: Request<MyEntity>, next: NextMiddleware): Promise<void> {
    // ...
    await next();
  }
}
```
then use it inside of `MyHandler` class

```typescript
import { EntityHandler, Use, AfterRead, Results, Req, Request} from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';
import { Middleware1 } from 'YOUR_MIDDLEWARE_LOCATION';

@EntityHandler(MyEntity)
@Use(Middleware1) // <== Add Middleware1 
export class MyHandler {
  // ...
  constructor() {}

  @AfterRead()
  @Use(Middleware1) // <== Or use it as method middleware
  private async aMethod(@Results() results: MyEntity[], @Req() req: Request) {
    // ...
  }
}
```

> [!TIP]
> Always stack [`@CatchAndSetErrorCode`](#catchandseterrorcode) and [`@CatchAndSetErrorMessage`](#catchandseterrormessage) decorators `last` `(at the bottom of the of the method)` so that other decorators are executed. 

> [!TIP]
> Decorators [`@CatchAndSetErrorCode`](#catchandseterrorcode) and [`@CatchAndSetErrorMessage`](#catchandseterrormessage) can be used in [`use` method of @Use](#use-1) middleware and class [`use` method of @Use](#use) middleware.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## `Deployment` to BTP using MTA

<!-- 1. Install [**MTA Build tool**](https://cap.cloud.sap/docs/get-started/) globally:

```bash
npm i -g mbt
``` -->

1. Add `mta.yaml` to your project using the following command :

```bash
cds add mta
```

2. Install `npm-run-all` and `rimraf` packages:

```bash
npm install --save-dev npm-run-all rimraf
```

3. Modify your `package.json` by adding the following `scripts`:

```json
"build:cds": "cds build --production",
"build:ts": "tsc",
"build:srv:clean:ts": "rimraf --glob 'gen/srv/srv/**/*.ts'",

"build": "run-s build:cds build:ts build:srv:clean:ts"
```

4. Modify `mta.yaml` as follows :

```yml
- builder: custom
  commands:
    - npm ci
    - npm run build
    - npx @cap-js/cds-typer "*" --outputDirectory gen/srv/@cds-models
```

`Steps` explained :

- `npm ci` - Will do a clean install
- `npm run build` - will run the package.json script command for CDS build and transpilation of TS to JS and clean the `TS files`.
- `npx @cap-js/cds-typer "*" --outputDirectory gen/srv/@cds-models` - will make sure the @cds-models are generated.

5. Install [**MTA Build tool**](https://cap.cloud.sap/docs/get-started/) globally:

```bash
npm i -g mbt
```

6. Run command to produce the `.mtar file`

```bash
mbt build
```

7. Deploy your `mtar` to BTP

## `Best practices` & `tips`

<details>

<summary>Can I stack multiple decorators on the same callback ? </summary>

Yes, you can stack multiple decorators.

`Example 1`

```ts
@AfterRead()
@Use(MiddlewareMethodAfterRead1, MiddlewareMethodAfterRead2)
@FieldsFormatter<MyEntity>({ action: 'blacklist', charsToRemove: 'Mysterious' }, 'title')
private async aMethod(@Results() results: MyEntity[], @Req() req: Request) {
  // ...
}
```

`Example 2`

```ts
@BeforeRead()
@BeforeCreate()
@BeforeUpdate()
@BeforeDelete()
private async aMethod(@Req() req: Request<MyEntity>) {
  // ..
}
```

</details>

<details>

<summary>Is the sequence of decorators important ? </summary>

Yes, it is important as typescript executes the decorators :

- for `Class` - from `bottom` to `top`
- for `method` - from `top` to `bottom`

```ts
@SecondClassDecorator() // second executed
@FirstClassDecorator() // first executed
class MyClass {
  @FirstDecorator() // first executed
  @SecondDecorator() // second executed
  myMethod() {
    console.log('Method called');
  }
}
```

</details>

<details>

<summary>Best practices for @FieldsFormatter - customFormatter</summary>

To have all the custom formatters in one place you can create a new `formatters.ts` where you will place all custom formatters and use `export` to make them visible.

```ts
// formatter.ts
export const customFormatter: Formatters<BookFormat> = {
  action: 'customFormatter',
  callback(req, results) {
    if (results && results.length > 0) {
      // make first item 'toLowerCase' and leave the rest 'toUpperCase'
      results[0].format = results[0].format?.toLowerCase();
    }
  },
};
```

`Import the customFormatter` in your handler

```ts
@AfterRead()
@FieldsFormatter<MyEntity>(customFormatter, 'format') // import it here
private async afterRead(@Results() results: MyEntity[], @Req() req: Request<MyEntity>) {
  // ...
}
```

> [!TIP]
> To get all the Formatters typing you can import the `Formatters\<T>` type where `T` is the entity of your `CDS` provided by [CDS-Typer](#generate-cds-typed-entities)

</details>

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## `Samples`

Find here a collection of samples for the [CDS-TS-Dispatcher-Samples](https://github.com/dxfrontier/cds-ts-samples)

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

![Licence](https://img.shields.io/github/license/Ileriayo/markdown-badges?style=for-the-badge)

Copyright (c) 2024 DXFrontier

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
