<h2> CDS-TS Dispatcher </h2>

![SAP](https://img.shields.io/badge/SAP-0FAAFF?style=for-the-badge&logo=sap&logoColor=white)
![ts-node](https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white)
![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![json](https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

![NPM Downloads](https://img.shields.io/npm/dy/@dxfrontier/cds-ts-dispatcher?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/%40dxfrontier%2Fcds-ts-dispatcher?logo=npm)
![NPM Version](https://img.shields.io/npm/v/%40dxfrontier%2Fcds-ts-dispatcher?logo=npm)

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/dxfrontier/cds-ts-dispatcher/release.yml?logo=git)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/dxfrontier/cds-ts-dispatcher/main?logo=git)
![GitHub issues](https://img.shields.io/github/issues/dxfrontier/cds-ts-dispatcher?logo=git)
![GitHub contributors](https://img.shields.io/github/contributors/dxfrontier/cds-ts-dispatcher?logo=git)
![GitHub top language](https://img.shields.io/github/languages/top/dxfrontier/cds-ts-dispatcher?logo=git)
![GitHub Repo stars](https://img.shields.io/github/stars/dxfrontier/cds-ts-dispatcher?style=flat&logo=git)

The goal of CDS-TS-Dispatcher is to significantly reduce the boilerplate code required to implement **Typescript handlers** provided by the SAP CAP framework.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [`Option 1 :` Install CDS-TS-Dispatcher - `New project`](#option-1--install-cds-ts-dispatcher---new-project)
  - [`Option 2 :` Install CDS-TS-Dispatcher - `Existing project`](#option-2--install-cds-ts-dispatcher---existing-project)
  - [`Option 3 :` Install CDS-TS-Dispatcher - ` Setup with development container`](#option-3--install-cds-ts-dispatcher----setup-with-development-container)
    - [Docker \& VSCode - `(local development)`](#docker--vscode---local-development)
    - [SAP Business Application Studio - `(BAS)`](#sap-business-application-studio---bas)
  - [`Generate CDS Typed entities`](#generate-cds-typed-entities)
    - [Option 1 - `Recommended`](#option-1---recommended)
    - [Option 2](#option-2)
    - [`Important`](#important)
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
      - [@Inject(SRV)](#injectsrv)
    - [`Parameter`](#parameter)
      - [@Req](#req)
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
    - [`Method`-`active entity`](#method-active-entity)
      - [`Before`](#before)
        - [@BeforeCreate](#beforecreate)
        - [@BeforeRead](#beforeread)
        - [@BeforeUpdate](#beforeupdate)
        - [@BeforeDelete](#beforedelete)
      - [`After`](#after)
        - [@AfterCreate](#aftercreate)
        - [@AfterRead](#afterread)
        - [@AfterUpdate](#afterupdate)
        - [@AfterDelete](#afterdelete)
      - [`On`](#on)
        - [@OnCreate](#oncreate)
        - [@OnRead](#onread)
        - [@OnUpdate](#onupdate)
        - [@OnDelete](#ondelete)
        - [@OnAction](#onaction)
        - [@OnFunction](#onfunction)
        - [@OnEvent](#onevent)
        - [@OnError](#onerror)
        - [@OnBoundAction](#onboundaction)
        - [@OnBoundFunction](#onboundfunction)
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
      - [@Validate](#validate)
      - [@FieldsFormatter](#fieldsformatter)
      - [@ExecutionAllowedForRole](#executionallowedforrole)
      - [@Use](#use-1)
- [`Deployment` to BTP using MTA](#deployment-to-btp-using-mta)
- [`Best practices` \& `tips`](#best-practices--tips)
- [`Examples`](#examples)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)

## Prerequisites

Install [**@sap/cds-dk**](https://cap.cloud.sap/docs/get-started/) globally:

```bash
npm install -g @sap/cds-dk typescript
```

## Installation

### `Option 1 :` Install CDS-TS-Dispatcher - `New project`

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

3. Add [CDS-Typer](#generate-cds-typed-entities) to your npm package.json:

```bash
cds add typer
npm install
```

4. Add the the following NPM packages :

```bash
npm install @dxfrontier/cds-ts-dispatcher
npm install --save-dev @types/node
```

5. Add a **tsconfig.json** :

```bash
tsc --init
```

6. It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    /* Base Options: */
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

    /* Allow decorators */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    /* Strictness */
    "strict": true,

    "lib": ["es2022"],

    "outDir": "./gen/srv"
  },
  "include": ["./srv"]
}
```

7. Run the `CDS-TS` server

```bash
cds-ts watch
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Option 2 :` Install CDS-TS-Dispatcher - `Existing project`

Use the following steps if you want to add only the **@dxfrontier/cds-ts-dispatcher to an existing project :**

```bash
npm install @dxfrontier/cds-ts-dispatcher
```

It is recommended to use the following **tsconfig.json** properties:

```json
{
  "compilerOptions": {
    /* Base Options: */
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

    /* Allow decorators */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    /* Strictness */
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
> npm install @sap/cds@latest
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

### `Option 3 :` Install CDS-TS-Dispatcher - ` Setup with development container`

The `CDS-TS-Dispatcher dev container` repository contains the [CDS-TS-Dispatcher](https://github.com/dxfrontier/cds-ts-dispatcher) & [CDS-TS-Repository](https://github.com/dxfrontier/cds-ts-repository) and `all dependencies` needed to boot a new project :

`Tools` installed inside of the container :

- `Controller` - `Service` - `Repository` project structure folders :
  - `controller`
  - `service`
  - `repository`
  - `middleware`
  - `util`
  - `test`
- `ESLint`, `Prettier`
- `VSCode Extensions` best extensions for SAP CAP TypeScript development
- `Cloud MTA Build tool` for building `MTA file`
- `Cloud Foundry CLI (CF)`
- `Git`, `Cds`, `Npm`, `Node`
- `CDS-Typer` for building typescript entities out of `CDS files`
- `tsconfig.json, .eslintrc, .prettierrc` - predefined properties
- `package.json` - predefined `scripts`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Docker & VSCode - `(local development)`

1. Install [**Docker desktop**](https://www.docker.com/products/docker-desktop/)
2. Clone [CDS-TS-Dispatcher devcontainer](https://github.com/dxfrontier/cds-ts-dispatcher-dev-container.git) using below command :

```bash
git clone https://github.com/dxfrontier/cds-ts-dispatcher-dev-container
```

3. Open project in `VSCode` using:

```bash
code cds-ts-dispatcher-dev-container
```

4. Change GIT remote origin to your origin

```bash
git remote remove origin
git remote add origin https://github.com/user/YOUR_GIT_REPOSITORY.git
git branch -M main
git push -u origin main
```

6. Install [Remote development pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) VScode extension

7. COMMAND + SHIFT + P on `MacOS` or CTRL + SHIFT + P on `Windows`

   1. Type - `Rebuild and Reopen in Container` - This step will start creating the container project and start the Node server.

8. Start development as usual.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### SAP Business Application Studio - `(BAS)`

1. Clone `CDS-TS-Dispatcher container` using below command :

```bash
git clone https://github.com/dxfrontier/cds-ts-dispatcher-dev-container
```

2. Change GIT remote origin to your origin

```bash
git remote remove origin
git remote add origin https://github.com/user/YOUR_GIT_REPOSITORY.git
git branch -M main
git push -u origin main
```

3. Start development as usual.

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### Option 2

Execute the command :

```bash
npx @cap-js/cds-typer "*" --outputDirectory ./srv/util/types/entities
```

- Target folder :`./srv/util/types/entities` - Change to your desired destination folder.

> [!TIP]
> If above option is being used, you have to run every time the command when you do a change in a `.CDS file`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Important`

> [!CAUTION]
> Import always the `generated entities from the service folders and not from the index.ts`

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/common/cds_typer_entities_@cds-models.png?raw=true)

For more info see official **[SAP CDS-Typer](https://cap.cloud.sap/docs/tools/cds-typer)** page.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Usage

### `Architecture`

**We recommend adhering** to the **Controller-Service-Repository** design pattern using the following folder structure:

1. [EntityHandler](#entityhandler) `(Controller)` - Responsible for managing the REST interface to the business logic implemented in [ServiceLogic](#servicelogic)
2. [ServiceLogic](#servicelogic) `(Service)` - Contains business logic implementations
3. [Repository](#repository) `(Repository)` - This component is dedicated to handling entity manipulation operations by leveraging the power of [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql).

`Controller-Service-Repository` suggested folder structure

![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure.png?raw=true) <= expanded folders => ![alt text](https://github.com/dxfrontier/markdown-resources/blob/main/cds-ts-dispatcher/architecture_folder_structure_expanded.png?raw=true)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

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

**@EntityHandler**(`entity`: CDSTyperEntity)

The `@EntityHandler` decorator is utilized at the `class-level` to annotate a class with the specific `entity` that will be used in all handlers.

`Parameters`

- `entity (CDSTyperEntity)`: A specialized class generated using the [CDS-Typer](#generate-cds-typed-entities).

`Example`

```typescript
import { EntityHandler } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class BookHandler {
  // ...
  constructor() {}
  // ... all events like @AfterRead, @BeforeRead ...
}
```

> [!TIP]
> After creation of `BookHandler` class, you can `import it` into the [CDSDispatcher](#CDSDispatcher).
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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @ServiceLogic

**@ServiceLogic()**

The `@ServiceLogic` decorator is utilized at the `class-level` to annotate a `class` as a specialized class containing only business logic.

When applying `ServiceLogic` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Repository

**@Repository()**

The `@Repository` decorator is utilized as a `class-level` annotation that designates a particular `class` as a specialized `Repository`.

When applying `Repository` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

```typescript
import { Repository } from '@dxfrontier/cds-ts-dispatcher';

@Repository()
export class CustomerRepository {
  // ...
  constructor() {}
  // ...
}
```

###### `[Optional]` - CDS-TS-Repository - BaseRepository

The **[CDS-TS-Repository - BaseRepository](https://github.com/dxfrontier/cds-ts-repository)** was designed to reduce the boilerplate code required to implement data access layer for persistance entities.

It simplifies the implementation by offering a set of ready-to-use actions for interacting with the database. These actions include:

- `.create()`: Create new records in the database.
- `.findAll()`: Retrieve all records from the database.
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

The `@UnboundActions` decorator is utilized at the `class-level` to annotate a `class` as a specialized class which will be used only for Unbound actions.

The following decorators can be used inside of `@UnboundActions()` :

- [@OnAction](#onaction)
- [@OnFunction](#onfunction)
- [@OnEvent](#onevent)
- [@OnError](#onerror)

`Example`

```typescript
import { UnboundActions, OnAction, OnFunction, OnEvent, Req, Next, Error } from '@dxfrontier/cds-ts-dispatcher';
import { MyAction, MyFunction, MyEvent } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { ActionRequest, ActionReturn, TypedRequest, Request, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

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
  private async onEventMethod(@Req() req: TypedRequest<MyEvent>) {
    // ...
  }

  // Unbound error
  @OnError()
  private onErrorMethod(@Error() err: Error, @Req() req: Request) {
    // ...
  }
}
```

`Imported it` in the [CDSDispatcher](#CDSDispatcher)

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

`Example:` middleware implementation

```typescript
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareClass implements MiddlewareImpl {
  public async use(req: Request, next: NextMiddleware) {
    console.log('Middleware use method called.');

    await next(); // call next middleware
  }
}
```

`Example` usage

```typescript
import { EntityHandler, Use, Inject, SRV } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';
import { Middleware1, Middleware2, MiddlewareN } from 'YOUR_MIDDLEWARE_LOCATION';

import type { Service } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
@Use(Middleware1, Middleware2, MiddlewareN)
export class CustomerHandler {
  // ...
  @Inject(SRV) private srv: Service;
  // ...
  constructor() {}
  // ...
}
```

> [!TIP]
>
> 1. Think of it _(middleware)_ like as a reusable class, enhancing the functionality of all events within the class.
> 2. Middlewares when applied with `@Use` are executed before the normal events.
> 3. If you need to apply middleware to `method` you can have a look over method specific [@Use](#use-1) decorator .

> [!WARNING]
> If `req.reject()` is being used inside of middleware this will stop the stack of middlewares, this means that next middleware will not be executed.

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
import { EntityHandler, Inject, SRV } from "@dxfrontier/cds-ts-dispatcher";
import type { Service } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  ...
  @Inject(CustomerService) private customerService: CustomerService
  @Inject(CustomerRepository) private customerService: CustomerRepository
  @Inject(AnyOtherInjectableClass) private repository: AnyOtherInjectableClass

  @Inject(SRV) private srv: Service
  // ...
  constructor() {}
  // ...
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Inject(SRV)

**@Inject**(SRV) `private srv: Service`

This specialized `@Inject` can be used as a `constant` in `@ServiceLogic`, `@Repository`, `@EntityHandler` and `@UnboundActions` classes, it can be accessed trough `this.srv` and contains the `CDS srv` for further enhancements.

`Example`

```typescript
import { EntityHandler, Inject, SRV } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { Service } from '@dxfrontier/cds-ts-dispatcher';

@EntityHandler(MyEntity)
// OR @ServiceLogic()
// OR @Repository()
// OR @UnboundActions()
export class CustomerHandler {
  // @Inject dependencies
  @Inject(SRV) private srv: Service;

  constructor() {}
  // ...
}
```

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Parameter`

##### @Req

**@Req()**

The `@Req` decorator is utilized at the `parameter level` to annotate a parameter with the `Request` object, providing access to request-related information.

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

##### @Results / @Result

**@Results()** / **@Result**

The `@Results` decorator is utilized at the `parameter level` to annotate a parameter with the request `Results`.

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
>
> ```ts
> @AfterCreate()
> @AfterUpdate()
> private async aMethod(
>   @Result() result: Book, // <== @Result() decorator used to annotate it's a an object and not an array
>   @Req() req: Request,
> ) {
>   // ...
> }
>
> @AfterRead()
> private async aMethod(
>   @Results() result: Book[], // <== @Results() decorator used to annotate as array of objects
>   @Req() req: Request,
> ) {
>   // ...
> }
>
> @AfterDelete()
> private async aMethod(
> @Result() deleted: boolean, // <== @Result() decorator used to annotate as a boolean
> @Req() req: Request,
> ) {
>   // ...
> }
> ```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Next

**@Next()**

The `@Next` decorator is utilized at the `parameter level` to annotate a parameter with the CDS `Next` function, which is used to proceed to the next middleware in the chain.

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
  public async onCreate(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
    return next();
  }
}
```

> [!TIP]
> Decorator `@Next` can be applied to all [On](#on), [On - draft](#on-1) event decorators.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @Error

**@Error()**

The `@Error` decorator is utilized at the `parameter level` to annotate a parameter with the CDS `Error` and contains information regarding the failed `Request`.

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

The `@Jwt` decorator is utilized at the `parameter level` to annotate a parameter to retrieve `JWT` from the `Request` that is based on the node `req.http.req - IncomingMessage`.

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
  private async aMethod(@Req() req: Request, @Results() results: MyEntity[], @Jwt(): string | undefined) {
    // ... req...
  }
}
```

> [!TIP]
> Expected format is `Bearer <TOKEN>`.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsPresent

**@IsPresent\<Key extends CRUDQueryKeys>(key: Key, property: PickQueryPropsByKey\<Key>)**

The `@IsPresent` decorator is utilized at the `parameter level` to annotate a parameter for allowing verification of the existence of a specific `property` value.

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
> Decorator [@IsPresent()](#ispresent) works well with [@GetQuery()](#getqueryproperty).

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsRole

**@IsRole(role: string)**

The `@IsRole` decorator is utilized at the `parameter level` to annotate a parameter, allowing the verification
of a user having assigned a given role. It applies an `OR` logic between the roles, meaning it
checks if at `least one` of the specified roles is assigned.

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

[!TIP]

> The role names correspond to the values of `@requires` and the `@restrict.grants.to` annotations in your `CDS` models.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @IsColumnSupplied

**@IsColumnSupplied\<T\>(field : keyof T)**

The `@IsColumnSupplied` decorator is utilized at the `parameter level` to annotate a parameter, verifying the existance of a column in the `SELECT`, `INSERT` or `UPSERT` query types.

`Parameters`

- `column (string)`: A string representing the name of the column to be verified.

`Return` :

- `boolean`: This decorator returns `true` if `column` was found, `false` otherwise

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

The `@GetQuery` decorator is utilized at the `parameter level` to annotate a parameter allowing retrieval of the specified `property` value.

`Parameters`

- `key (string)`: Specifies the type of query operation. Accepted values are `INSERT`, `SELECT`, `UPDATE`, `UPSERT`, `DELETE`.
- `property (string)`: Specifies the property based on the `key`.

`Return` Type: Varies based on the specified property :

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
    }

    // ...
  }
}
```

> [!TIP]
> Decorator `@GetQuery` works well with [@IsPresent()](#ispresent).

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @GetRequest

**@GetRequest(property : keyof Request)**

The `@GetRequest` decorator is utilized at the `parameter level` to annotate a parameter, allowing retrieval of the specified property value from the `Request` object.

`Parameters`

- `property (string)`: Specifies the property to retrieve from the `Request` object.

`Return` Type: Varies based on the specified property :

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

> [!TIP]
> Type `Request` can be import from :
>
> ```ts
> import type { Request } from '@dxfrontier/cds-ts-dispatcher';
> ```

`Example`

```typescript
import { EntityHandler, Results, GetRequest } from '@dxfrontier/cds-ts-dispatcher';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

import type { GetTypeLocale, GetTypeMethod, Request } from '@dxfrontier/cds-ts-dispatcher';

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @SingleInstanceSwitch

**@SingleInstanceSwitch**

The `@SingleInstanceSwitch()` decorator is applied at the `parameter level`.

It allows you to manage different behaviors based on whether the request is for a `single entity instance` or `an entity set`, the parameter assigned to the decorator will behave like a **`switch`**.

`Return`

- `true` when the `Request` is `single instance`
- `false` when the `Request` is `entity set`

`Example 1`

Single request : http://localhost:4004/odata/v4/main/`MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)`

```typescript
import { AfterRead, SingleInstanceCapable } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async singeInstanceMethodAndEntitySet(@Results() results : MyEntity[], @Req() req: TypedRequest<MyEntity>, @SingleInstanceSwitch() isSingleInstance: boolean) {
  if(isSingleInstance) {
    // This will be executed only when single instance is called : http://localhost:4004/odata/v4/main/MyEntity(ID=2f12d711-b09e-4b57-b035-2cbd0a023a09)
    return this.customerService.handleSingleInstance(req)
  }

  // nothing to entity set
}
```

`Example 2`

Entity request : http://localhost:4004/odata/v4/main/`MyEntity`

```typescript
import { AfterRead, SingleInstanceCapable } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async singeInstanceMethodAndEntitySet(@Results() results : MyEntity[], @Req() req: TypedRequest<MyEntity>, @SingleInstanceSwitch() isSingleInstance: boolean) {
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

#### `Method`-`active entity`

##### `Before`

Use [@BeforeCreate()](#beforecreate), [@BeforeRead()](#beforeread), [@BeforeUpdate()](#beforeupdate), [@BeforeDelete()](#beforedelete) to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `TypedRequest`

See also the official SAP JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

> [!TIP]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use
>
> - @BeforeCreateDraft()
> - @BeforeReadDraft()
> - @BeforeUpdateDraft()
> - @BeforeDeleteDraft()

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @BeforeCreate

**@BeforeCreate**()

It is important to note that decorator `@BeforeCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeCreate } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCreate()
private async beforeCreateMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeRead

**@BeforeRead**()

It is important to note that decorator `@BeforeRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeRead } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeRead()
private async beforeReadMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeUpdate

**@BeforeUpdate**()

It is important to note that decorator `@BeforeUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeUpdate } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeUpdate()
private async beforeUpdateMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeDelete

**@BeforeDelete**()

It is important to note that decorator `@BeforeDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeDelete } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeDelete()
private async beforeDeleteMethod(@Req() req: TypedRequest<MyEntity>) {
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

##### `After`

Use [@AfterCreate()](#aftercreate), [@AfterRead()](#afterread), [@AfterUpdate()](#afterupdate), [@AfterDelete()](#afterdelete) register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.`

The handlers receive two arguments:

- `results` (for `@AfterRead`): An array of type `MyEntity[]`.
- `result` (for `@AfterUpdate` and `@AfterCreate`): An object of type `MyEntity`.
- `deleted` (for `@AfterDelete`): A `boolean` indicating whether the entity was deleted.
- `req`: An object of type `TypedRequest` or `Request`.

> [!TIP]
> If `@odata.draft.enabled: true` to manage event handlers for draft version you can use :
>
> - `@AfterCreateDraft()`
> - `@AfterReadDraft()`
> - `@AfterUpdateDraft()`
> - `@AfterDeleteDraft()`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @AfterCreate

**@AfterCreate**()

It is important to note that decorator `@AfterCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterCreate } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCreate()
private async afterCreateMethod(@Result() @Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterRead

**@AfterRead**()

`Example`

It is important to note that decorator `@AfterRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` `MyEntity`

```typescript
import { AfterRead } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterRead()
private async afterReadMethod(@Results() results: MyEntity[], @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterUpdate

**@AfterUpdate**()

It is important to note that decorator `@AfterUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterUpdate } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterUpdate()
private async afterUpdateMethod(@Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterDelete

**@AfterDelete**()

It is important to note that decorator `@AfterDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### `On`

Use [@OnCreate()](#oncreate), [@OnRead()](#onread), [@OnUpdate()](#onupdate), [@OnDelete()](#ondelete), [OnAction()](#onaction), [@OnFunction()](#onfunction), [@OnBoundAction()](#onboundaction), [@OnBoundFunction()](#onboundfunction) handlers to fulfill requests, e.g. by reading/writing data from/to databases handlers.

The handlers receive two arguments:

- `req` of type `TypedRequest`
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

It is important to note that decorator `@OnCreate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnCreate, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCreate()
private async onCreateMethod(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnRead

**@OnRead**()

It is important to note that decorator `@OnRead()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnRead, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnRead()
private async onReadMethod(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnUpdate

**@OnUpdate**()

It is important to note that decorator `@OnUpdate()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript

import { OnUpdate, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnUpdate()
private async onUpdateMethod(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnDelete

**@OnDelete**()

It is important to note that decorator `@OnDelete()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnDelete, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnDelete()
private async onDeleteMethod(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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
> Decorator `@OnAction` should be used inside [@UnboundActions](#unboundactions) class.

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
> Decorator `@OnFunction` should be used inside [@UnboundActions](#unboundactions) class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnEvent

**@OnEvent**(`name` : CdsEvent)

The `@OnEvent` decorator facilitates the listening of messages from a message broker.

This decorator is particularly useful in conjunction with the [Emit method](https://cap.cloud.sap/docs/guides/messaging/#emitting-events) to handle triggered events.

`Parameters`

- `name (CdsEvent)` : Representing the `CDS event` defined in the `CDS file`.

`Example`

```typescript
import { OnEvent } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { AEvent } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnEvent(AEvent)
private async onEventMethod(req: TypedRequest<AEvent>) {
  // ...
}
```

`Equivalent to 'JS'`

```typescript
this.on('AEvent', async (req) => {
  // ...
});
```

> [!NOTE] > **AEvent** was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

> [!IMPORTANT]  
> Decorator `@OnEvent` should be used inside [@UnboundActions](#unboundactions) class.

> [!TIP]
> More info can be found at <https://cap.cloud.sap/docs/guides/messaging/>

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

It is important to note that decorator `@OnBoundAction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

###### @OnBoundFunction

**@OnBoundFunction**(`name` : CdsFunction)

It is important to note that decorator `@OnBoundFunction()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

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

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the the class.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Method`-`draft entity`

##### `Before`

Use `@BeforeNewDraft(), @BeforeCancelDraft(), @BeforeEditDraft(), @BeforeSaveDraft(), @BeforeCreateDraft(), @BeforeReadDraft(), @BeforeUpdateDraft(), @BeforeDeleteDraft()` to register handlers to run before`.on`handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `TypedRequest`

###### @BeforeNewDraft

**@BeforeNewDraft**()

Use this decorator when you want to validate inputs before a new draft is created.

It is important to note that decorator `@BeforeNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeNewDraft, TypedRequest } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeNewDraft()
private async beforeCreateDraftMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeCancelDraft

**@BeforeCancelDraft**()

Use this decorator when you want to validate inputs before a draft is discarded.

It is important to note that decorator `@BeforeCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeCancelDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeCancelDraft()
private async beforeCancelDraftMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeEditDraft

**@BeforeEditDraft**()

Use this decorator when you want to validate inputs when a new draft is created from an active instance.

It is important to note that decorator `@BeforeEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeEditDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeEditDraft()
private async beforeEditDraftMethod(@Req() req: TypedRequest<MyEntity>) {
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

###### @BeforeSaveDraft

**@BeforeSaveDraft**()

Use this decorator when you want to validate inputs when active entity is changed.

It is important to note that decorator `@BeforeSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { BeforeSaveDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@BeforeSaveDraft()
private async beforeSaveDraftMethod(@Req() req: TypedRequest<MyEntity>) {
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

##### `After`

Use `@AfterNewDraft(), @AfterCancelDraft(), @AfterEditDraft(), @AfterSaveDraft(), @AfterCreateDraft(), @AfterReadDraft(), @AfterUpdateDraft(), @AfterDeleteDraft()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.` The handlers receive two arguments:

The results from the preceding `.on` handler, with the following types:

- `results` (of type `MyEntity[]`) for `@AfterRead`
- `result` (of type `MyEntity`) for `@AfterUpdate` and `@AfterCreate`
- `deleted` (of type `boolean`) for `@AfterDelete`
- `req` of type `TypedRequest`

###### @AfterNewDraft

**@AfterNewDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created.

It is important to note that decorator `@AfterNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterNewDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterNewDraft()
private async afterNewDraftMethod(@Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterCancelDraft

**@AfterCancelDraft**()

Use this decorator when you want to enhance outbound data when a draft is discarded.

It is important to note that decorator `@AfterCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterCancelDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterCancelDraft()
private async afterCancelDraftMethod(@Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterEditDraft

**@AfterEditDraft**()

Use this decorator when you want to enhance outbound data when a new draft is created from an active instance.

It is important to note that decorator `@AfterEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterEditDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterEditDraft()
private async afterEditDraftMethod(@Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

###### @AfterSaveDraft

**@AfterSaveDraft**()

Use this decorator when you want to enhance outbound data when the active entity is changed.

It is important to note that decorator `@AfterSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { AfterSaveDraft } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@AfterSaveDraft()
private async afterSaveDraftMethod(@Result() result: MyEntity, @Req() req: TypedRequest<MyEntity>) {
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

##### `On`

Use [@OnNewDraft()](#onnewdraft), [@OnCancelDraft()](#oncanceldraft), [@OnSaveDraft()](#onsavedraft), [@OnEditDraft()](#oneditdraft), @OnReadDraft(), @OnUpdateDraft(), @OnCreateDraft(), @OnDeleteDraft(), @OnBoundActionDraft(), @OnBoundFunctionDraft() handlers to support for both, active and draft entities.

The handlers receive two arguments:

- `req` of type `TypedRequest`
- `next` of type `NextEvent`

See Official SAP **[Fiori-draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)**

###### @OnNewDraft

**@OnNewDraft()**

This decorator will be triggered when `a new draft is created`.

It is important to note that decorator `@OnNewDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnNewDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnNewDraft()
private async onNewDraft(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

###### @OnCancelDraft

**@OnCancelDraft()**

This decorator will be triggered when `a draft is cancelled`.

It is important to note that decorator `@OnCancelDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnCancelDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnCancelDraft()
private async onCancelDraft(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

###### @OnEditDraft

**@OnEditDraft()**

This decorator will be triggered when `a new draft is created from an active instance`

It is important to note that decorator `@OnEditDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript
import { OnEditDraft, Req, Next } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnEditDraft()
private async onEditDraft(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

###### @OnSaveDraft

**@OnSaveDraft()**

This decorator will be triggered when `the active entity is changed`

It is important to note that decorator `@OnSaveDraft()` will be triggered based on the [EntityHandler](#entityhandler) `argument` => `MyEntity`

`Example`

```typescript

import { OnSaveDraft, Req, Next  } from "@dxfrontier/cds-ts-dispatcher";
import type { TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@OnSaveDraft()
private async onSaveDraft(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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

##### `Other draft decorators`

All active entity [On](#on), [Before](#before), [After](#after) events have also a `Draft` variant.

> [!NOTE]
> Except the `@OnAction(), @OnFunction(), @OnEvent(), @OnError()` as this are bound to the service and not to an entity.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

#### `Method`-`helpers`

##### @Validate

**@Validate\<T\>({ action, options? }, ...fields: Array\<keyof T>)**

The `@Validate` decorator is utilized as a `method-level` decorator, used to validate `fields` of your entity before reaching your event callback.

> [!TIP]
> Think of it as a `pre-validation` helper.

The `@Validate` decorator can be used when you want to `validate` the `Request`.`data` _(Request Body)_ of the `@sap/cds - Request` object on the following decorators :

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

- `action`: Choose from a list of predefined `Validators`.
- `options?`: _[Optional]_ Additional options for customizing the validation process.
- `...Fields[]`: Specify the fields of your entity that require validation.

`Returns`

The decorator will raise a `Request.reject` message if the validation requirements are not met.

`Validators`

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
| isIP             | Check if the string is an IP (version 4 or 6).                                                           | ` "4", "6", 4, 6;`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
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
  SRV,
  Validate,
  BeforeCreate,
  BeforeUpdate,
  OnCreate,
  OnUpdate,
  Req,
  Next,
} from '@dxfrontier/cds-ts-dispatcher';
import type { TypedRequest, Service, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(SRV) private srv: Service;
  // ...
  constructor() {}

  @BeforeCreate()
  @Validate<MyEntity>({ action: 'isLowercase' }, 'comment')
  @Validate<MyEntity>({ action: 'endsWith', target: 'N' }, 'description')
  private async beforeCreate(@Req() req: TypedRequest<MyEntity>) {
    // ...
  }

  @BeforeUpdate()
  @Validate<MyEntity>({ action: 'startsWith', target: 'COMMENT:' }, 'comment')
  @Validate<MyEntity>({ action: 'isAlphanumeric' }, 'description')
  private async beforeUpdate(@Req() req: TypedRequest<MyEntity>) {
    // ...
  }

  @OnCreate()
  @Validate<MyEntity>({ action: 'isAlphanumeric' }, 'book_ID')
  private async onCreate(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  @OnUpdate()
  @Validate<MyEntity>({ action: 'isLength', options: { min: 5 } }, 'comment')
  private async onUpdate(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  // ...
}
```

`Example 2`: `@Validate` is used inside of `@UnboundActions`

```ts
import { UnboundActions, OnAction, OnFunction, OnEvent, Validate, Next, Req } from '@dxfrontier/cds-ts-dispatcher';
import type { ExposeFields, TypedRequest, ActionRequest, ActionReturn, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

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
  private async onEvent(@Req() req: TypedRequest<OrderedBook>) {
    // ...
  }
}
```

> [!IMPORTANT]
> To get the fields for
>
> - [@OnAction](#onaction)
> - [@OnBoundAction](#onboundaction)
> - [@OnFunction](#onfunction)
> - [@OnBoundFunction](#onboundfunction)
>
> you must use the `ExposeFields type` inside of the `@Validate` decorator.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

##### @FieldsFormatter

**@FieldsFormatter\<T\>({ action, options? }, ...fields: Array\<keyof T>)**

The `@FieldsFormatter` is used as a `method level` decorator to `modify`/`enhance` fields.

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
- `...Fields[]`: Specify the fields of your entity that require formatting.

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
  SRV,
  BeforeCreate,
  BeforeUpdate,
  AfterRead,
  OnCreate,
  OnUpdate,
  FieldsFormatter,
  Req,
  Next,
} from '@dxfrontier/cds-ts-dispatcher';
import type { Service, TypedRequest, NextEvent } from '@dxfrontier/cds-ts-dispatcher';

import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(SRV) private srv: Service;
  // ...
  constructor() {}

  @BeforeCreate()
  @FieldsFormatter<MyEntity>({ action: 'blacklist', charsToRemove: 'le' }, 'format')
  private async beforeCreate(@Req() req: TypedRequest<MyEntity>) {
    // ...
  }

  @BeforeUpdate()
  @FieldsFormatter<MyEntity>({ action: 'truncate', options: { length: 7 } }, 'format')
  private async beforeUpdate(@Req() req: TypedRequest<MyEntity>) {
    // ...
  }

  @AfterRead()
  @FieldsFormatter<MyEntity>({ action: 'toUpper' }, 'format')
  @FieldsFormatter<MyEntity>(
    {
      action: 'customFormatter',
      callback(req, results) {
        if (results) {
          // make first item 'toLowerCase' and leave the rest 'toUpper'
          results[0].format = results[0].format?.toLowerCase();
        }
      },
    },
    'format',
  )
  private async afterRead(@Results() results: MyEntity[], @Req() req: TypedRequest<MyEntity>) {
    // ...
  }

  @OnCreate()
  @FieldsFormatter<MyEntity>({ action: 'ltrim' }, 'language')
  private async onCreate(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
    // ...
    return next();
  }

  @OnUpdate()
  @FieldsFormatter<MyEntity>({ action: 'trim' }, 'format')
  private async onUpdate(@Req() req: TypedRequest<MyEntity>, @Next() next: NextEvent) {
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
  private async onEvent(@Req() req: TypedRequest<AnEvent>) {
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

The `@ExecutionAllowedForRole` is used as a `method level` and was designed to enforce `role-based access control`, ensuring that only users with `specific roles` are authorized to execute the event.

`Parameters`

- `...roles: string[]`: Specifies the roles that are permitted to execute the event logic.

`Example 1`

```typescript
@AfterRead()
@ExecutionAllowedForRole('Manager', 'User', 'CEO')
private async afterRead(
  @Req() req: Request,
  @Results() results: BookSale[],
) {
  // Method implementation
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

`Example:` middleware implementation

```typescript
import type { MiddlewareImpl, NextMiddleware, Request } from '@dxfrontier/cds-ts-dispatcher';

export class MiddlewareClass implements MiddlewareImpl {
  public async use(req: Request, next: NextMiddleware) {
    console.log('Middleware use method called.');

    await next();
  }
}
```

`Example` usage

```typescript
import { EntityHandler, Use, Inject, SRV } from '@dxfrontier/cds-ts-dispatcher';
import type { Service, Request } from '@dxfrontier/cds-ts-dispatcher';

import { MiddlewareClass } from 'YOUR_MIDDLEWARE_LOCATION';
import { MyEntity } from 'YOUR_CDS_TYPER_ENTITIES_LOCATION';

@EntityHandler(MyEntity)
export class CustomerHandler {
  // ...
  @Inject(SRV) private srv: Service;
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

> [!WARNING]
> If `req.reject()` is being used inside of middleware this will stop the stack of middlewares, this means that next middleware will not be executed.

> [!NOTE]
> MyEntity was generated using [CDS-Typer](#generate-cds-typed-entities) and imported in the class.

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

2. Install `npm-run-all` package:

```bash
npm install --save-dev npm-run-all
```

3. Modify your `package.json` by adding the following `scripts`:

```json
"build:cds": "echo 'STEP 1 : Build CDS' && cds build --production",
"build:ts": "echo 'STEP 2 : Transpile TS => JS' && tsc",
"build:srv:clean:ts": "echo 'Step 3: Clean TS files from srv folder' && find gen/srv/srv -type f -name '*.ts' -delete",

"build:production": "run-s build:cds build:ts build:srv:clean:ts"
```

4. Modify `mta.yaml` as follows :

```yml
- builder: custom
  commands:
    - npm ci
    - npm run build:production
    - npx @cap-js/cds-typer "*" --outputDirectory gen/srv/@cds-models
```

`Steps` explained :

- `npm ci` - Will do a clean install
- `npm run build:production` - will run the package.json script command for CDS build and transpilation of TS to JS and clean the `TS files`.
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

Yes, you can stack multiple decorators, if the decorators have the same typed parameters like the other decorators, then you can stack them, otherwise an error will appear at the design time.

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
private async aMethod(@Req() req: TypedRequest<MyEntity>) {
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

`Import the customFormatter` into your handler

```ts
@AfterRead()
@FieldsFormatter<MyEntity>(customFormatter, 'format') // import it here
private async afterRead(@Results() results: MyEntity[], @Req() req: TypedRequest<MyEntity>) {
  // ...
}
```

[!TIP]

> To get all the Formatters typing you can import the `Formatters\<T>` type where `T` is the entity of your `CDS` provided by [CDS-Typer](#generate-cds-typed-entities)

</details>

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## `Examples`

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
