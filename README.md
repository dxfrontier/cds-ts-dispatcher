# CDS-TS Dispatcher

<img src="https://img.shields.io/badge/SAP-0FAAFF?style=for-the-badge&logo=sap&logoColor=white" /> <img src="https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white" /> <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" /><img src="https://img.shields.io/badge/json-5E5C5C?style=for-the-badge&logo=json&logoColor=white" /> <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" /> <img src="https://img.shields.io/badge/Cloud%20Foundry-0C9ED5?style=for-the-badge&logo=Cloud%20Foundry&logoColor=white" /> <img src="https://img.shields.io/badge/kubernetes-326ce5.svg?&style=for-the-badge&logo=kubernetes&logoColor=white" />

<!-- ![](https://img.shields.io/github/stars/pandao/editor.md.svg) ![](https://img.shields.io/github/forks/pandao/editor.md.svg) ![](https://img.shields.io/github/tag/pandao/editor.md.svg) ![](https://img.shields.io/github/release/pandao/editor.md.svg) ![](https://img.shields.io/github/issues/pandao/editor.md.svg) ![](https://img.shields.io/bower/v/editor.md.svg) -->

`SAP CAP` `NodeJS-based project` using TypesScript decorators for rapid development.

The goal of SAP CAP Nodejs Decorators is to significantly reduce the boilerplate code required to implement `JS` handlers provided by the `SAP CAP framework`.

<a name="readme-top"></a>

## Table of Contents

- [CDS-TS Dispatcher](#cds-ts-dispatcher)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Architecture](#architecture)
  - [Usage](#usage)
    - [CDSDispatcher](#cdsdispatcher)
    - [Decorators](#decorators)
      - [Class](#class)
        - [EntityHandler](#entityhandler)
        - [Service](#service)
        - [Repository](#repository)
      - [Fields](#fields)
        - [Inject](#inject)
        - [Inject SRV](#inject-srv)
      - [Methods](#methods)
        - [Before](#before)
          - [BeforeCreate](#beforecreate)
          - [BeforeRead](#beforeread)
          - [BeforeUpdate](#beforeupdate)
          - [BeforeDelete](#beforedelete)
          - [BeforeAction](#beforeaction)
        - [After](#after)
          - [AfterCreate](#aftercreate)
          - [AfterRead](#afterread)
          - [AfterUpdate](#afterupdate)
          - [AfterDelete](#afterdelete)
          - [AfterAction](#afteraction)
        - [On](#on)
          - [OnCreate](#oncreate)
          - [OnRead](#onread)
          - [OnUpdate](#onupdate)
          - [OnDelete](#ondelete)
          - [OnAction](#onaction)
          - [OnFunction](#onfunction)
        - [Fiori draft](#fiori-draft)
          - [Draft](#draft)
          - [OnActionDraft](#onactiondraft)
          - [OnNewDraft](#onnewdraft)
          - [OnCancelDraft](#oncanceldraft)
          - [OnEditDraft](#oneditdraft)
          - [OnSaveDraft](#onsavedraft)
    - [Example](#example)
  - [Contributing](#contributing)
  - [License](#license)
  - [Authors](#authors)

## Installation

To get started follow these steps:

```bash
npm install reflect-metadata
npm install [OUR_NPM_PACKAGE]
```

Once installed, import `reflect-metadata` in your `server.ts`

```typescript
import 'reflect-metadata'
```

Modify your `tsconfig.json` to enable `decorators` usage :

```bash

"experimentalDecorators": true,                   /* Enable experimental support for legacy experimental decorators. */
"emitDecoratorMetadata": true,                    /* Emit design-type metadata for decorated
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

**We recommend adhering** to the **Controller-Service-Repository** design pattern using the following folder structure:

1. [EntityHandler](#entityhandler) - Manages the REST interface to the business logic [Service](#service)
2. [Service](#service) - Contains business logic implementations
3. [Repository](#repository) - Will contain manipulation of entities through the utilization of [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql).
   1. `[Optional enhancement]` To simplify `entity manipulation` using [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql), a `BaseRepository` `npm package` was created for [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql) of the most common `database actions` like `.create(...), findAll(), find(...), delete(...), exists() ...`

![Alt text](image.png) <= expanded folders => ![Alt text](image-1.png)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

### CDSDispatcher

**CDSDispatcher**(`entities` : `Constructable[]`)

The `CDSDispatcher` constructor allows you to create an instance for dispatching and managing entities.

`CDSDispatcher` class will initialize all **[Entity handler](#entityhandler)(s)** and all of their `Dependencies` : [Services](#service), [Repositories](#repository).

`Parameters`

- `entities (Array)`: An array of **[Entity handler](#entityhandler)(s)** classes (Constructable) that represent the different types of entities in the CDS.

`Example`

```typescript
module.exports = new CDSDispatcher([CustomerHandler, AddressHandler]).initializeEntityHandlers()
```

`CDS`

In your `*.ts` files, you need to point to the entity handlers which manage the `REST` interface

![Alt text](image-2.png)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Decorators

#### Class

##### EntityHandler

**@EntityHandler**(`entityName`: `string`)

The `@EntityHandler` decorator is utilized at the `class-level` to annotate a class with the specific `entity name` that will be used along the hole class.

`Parameters`

- `entityName (string)`: A string representing the `CDS entity name`, ensure it it matches `exact name` as define din the `.cds` file.

`Example`

```typescript
@EntityHandler('MyEntity')
class CustomerHandler {
  ...
  constructor() {}
  ...
```

`CDS`

```typescript
service MainService {
    entity MyEntity as projection on decorators.MyEntity; // MyEntity must match with @EntityHandler('MyEntity')
```

> Note @EntityHandler class should contain only handling of the `REST operations`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Service

**@Service()**

The `@Service` decorator is utilized at the `class-level` to annotate a `class` as a specialized `Service`.

When applying `Service` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

`Example`

```typescript
@Service()
class CustomerService {
  ...
  constructor() {}
  ...
```

> Note @Service class should contain only `business logic`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Repository

**@Repository()**

The `@Repository` decorator is utilized as a `class-level` annotation that designates a particular `class` as a specialized `Repository`.

When applying `Repository` decorator, the class becomes eligible to be used with [Inject](#inject) decorator for `Dependency injection`

```typescript
@Repository()
class CustomerRepository {
  ...
  constructor() {}
  ...
```

`OPTIONAL Enhancement` extend the [Repository](#repository) with `BaseRepository` accessible at [NPM]. TODO

This extension contains [CDS-QL](https://cap.cloud.sap/docs/node.js/cds-ql) `out of the box` database actions such as `.create(...), findAll(), , find(...), delete(...), exists() ...`

`Example`

```typescript
@Repository()
class CustomerRepository extends BaseRepository<MyEntity> {
  constructor() {
    super('MyEntity')
  }
}
```

> Note @Repository class should be exclusively responsible for managing `interactions between the database and service layers`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

#### Fields

##### Inject

**@Inject**(`serviceIdentifier: ServiceIdentifierOrFunc<unknown>`) `private / public / protected` `NAME_OF_CLASS` : `TYPE_OF_CLASS`

The `@Inject` decorator is utilized as a `field-level` decorator and allows you to inject dependencies into your classes or components.

`Parameters`

- `serviceIdentifier(Function or Symbol)`: A function or a symbol representing the service to inject.

`Example`

```typescript
@EntityHandler('MyEntity')
class CustomerHandler {
  ...
  @Inject(CustomerService) private customerService: CustomerService
  @Inject(ServiceHelper.SRV) private srv: CdsService
  ...
  constructor() {}
  ...
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Inject SRV

**@Inject**(`ServiceHelper.SRV`) `private srv: CdsService`

This specialized `@Inject` can be used as a `constant` in `@Service, @Repository and @EntityHandler` class, the `private srv` can be accessed trough `this.srv` and contains the `CDS srv` for further enhancements.

`Example`

```typescript
@EntityHandler('MyEntity')
// OR @Service()
// OR @Repository()
class CustomerHandler { // OR CustomerService, CustomerRepository
  ...
  @Inject(ServiceHelper.SRV) private srv: CdsService
  ...
  constructor() {}
  ...
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

#### Methods

##### Before

Use `@BeforeCreate(), @BeforeRead(), @BeforeUpdate(), @BeforeDelete(), BeforeAction()` to register handlers to run before `.on` handlers, frequently used for `validating user input.`

The handlers receive one argument:

- `req` of type `Request`

See JS **[CDS-Before](https://cap.cloud.sap/docs/node.js/core-services#srv-before-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeCreate

**@BeforeCreate**()

`Example`

```typescript
@BeforeCreate()
public async beforeCreateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@BeforeCreate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.before('CREATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeRead

`Example`

**@BeforeRead**()

```typescript
@BeforeRead()
public async beforeReadMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@BeforeCreate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.before('READ', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeUpdate

**@BeforeUpdate**()

`Example`

```typescript
@BeforeUpdate()
public async beforeUpdateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@BeforeCreate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.before('UPDATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeDelete

**@BeforeDelete**()

`Example`

```typescript
@BeforeDelete()
public async beforeDeleteMethod(req: Request) {
   return this.customerService.testExample(req)
}
```

Here, it is important to note that decorator `@BeforeDelete()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.before('DELETE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### BeforeAction

**@BeforeAction**(`name` : `string`)

`Parameters`

- `name (string)` : Representing the `CDS action name` defined in the `CDS file`

`Example`

```typescript
@BeforeAction('boundActionOrFunction')
public async beforeActionMethod(req: Request) {
   return this.customerService.testExample(req)
}
```

`Equivalent to 'JS'`

```typescript
this.before('boundActionOrFunction', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### After

Use `@AfterCreate(), @AfterRead(), @AfterUpdate(), @AfterDelete(), AfterAction()` register handlers to run after the `.on` handlers, frequently used to `enrich outbound data.` The handlers receive two arguments:

- `results` of type **`DEFINED USER TYPE`** — the outcomes of the `.on` handler which ran before
- `req` of type `Request`

To see how **`DEFINED USER TYPE`** can be created from `.cds` please have a look over [CDS2Types](https://www.npmjs.com/package/cds2types) or for official SAP package, refer to [CDSTyper](https://cap.cloud.sap/docs/tools/cds-typer)

See JS **[CDS-After](https://cap.cloud.sap/docs/node.js/core-services#srv-after-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterCreate

`Example`

**@AfterCreate**()

```typescript
@AfterCreate()
public async afterCreateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@AfterCreate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.after('CREATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterRead

**@AfterRead**()

`Example`

```typescript
@AfterRead()
public async afterReadMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@AfterRead()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.after('READ', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterUpdate

**@AfterUpdate**()

`Example`

```typescript
@AfterUpdate()
public async afterUpdateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@AfterUpdate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.after('UPDATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterDelete

**@AfterDelete**()

`Example`

```typescript
@AfterDelete()
public async afterDeleteMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@AfterDelete()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.after('DELETE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### AfterAction

**@AfterAction**(`name` : `string`)

`Parameters`

- `name (string)` : Representing the `CDS action name` defined in the `CDS file`

`Example`

```typescript
@AfterAction('boundActionOrFunction')
public async afterActionMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.after('boundActionOrFunction', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### On

Use `@OnCreate(), @OnRead(), @OnUpdate(), @OnDelete(), OnAction(), @OnFunction()` handlers to fulfill requests, e.g. by reading/writing data from/to databases handlers.

The handlers receive one argument:

- `req` of type `Request`

See JS **[CDS-On](https://cap.cloud.sap/docs/node.js/core-services#srv-on-request) event**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnCreate

**@OnCreate**()

`Example`

```typescript
@OnCreate()
public async onCreateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@OnCreate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.on('CREATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnRead

**@OnRead**()

`Example`

```typescript
@OnRead()
public async onReadMethod(req: Request) {
   return this.customerService.testExample(req)
}
```

Here, it is important to note that decorator `@OnRead()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.on('READ', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnUpdate

**@OnUpdate**()

`Example`

```typescript
@OnUpdate()
public async onUpdateMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@OnUpdate()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.on('UPDATE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnDelete

**@OnDelete**()

`Example`

```typescript
@OnDelete()
public async onDeleteMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

Here, it is important to note that decorator `@OnDelete()` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.on('DELETE', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnAction

**@OnAction**(`name` : `string`)

`Parameters`

- `name (string)` : Representing the `CDS action name` defined in the `CDS file`

`Example`

```typescript
@OnAction('boundActionOrFunction')
public async onActionMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('boundActionOrFunction', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

###### OnFunction

**@OnFunction**(`name` : `string`)

`Parameters`

- `name (string)` : Representing the `CDS action name` defined in the `CDS file`

`Example`

```typescript
@OnFunction('boundActionOrFunction')
public async onFunctionMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('boundActionOrFunction', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

##### Fiori draft

Use `@OnActionDraft(), @OnNewDraft(), @OnCancelDraft(), @OnEditDraft(), OnSaveDraft()` handlers to support for both, `active and draft entities`.

The handlers receive one argument:

- `req` of type `Request`

For more info about visit **[CDS-Fiori-draft](https://cap.cloud.sap/docs/node.js/fiori#draft-support)**

###### Draft

**@Draft()**

The `@Draft()` decorator is utilized at the `method-level` to annotate a method that this method and all decorators which are used along with this `Draft()` decorator, will be marked as a `Draft`.

`Important`

When utilizing the `@Draft()` decorator, the `placement of the @Draft() decorator` within your TypeScript class is very important factor to consider. It determines the scope of the `draft` mode within the methods that precede it.

`Example 1`

```typescript
@AfterUpdate() // Will be marked as draft
@AfterCreate() // Will be marked as draft
@AfterRead() // Will be marked as draft
@Draft() // All methods above '@Draft()' will be have 'draft' scope.
public async draftMethod(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.after(['UPDATE, CREATE, READ'], 'MyEntity.drafts', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

`Example 2`

When using `@Draft()` in-between other `Decorators`. The above decorators of the `@Draft()` will be placed `only as Draft`.
The rest `Decorators` below `@Draft()` will be work on active entities.

```typescript
@AfterUpdate() // Marked as a draft
@Draft() // Draft is in-between 'after', this means that only '@AfterUpdate' will me marked as draft
@AfterCreate() // Will work on active entity
@AfterRead() // Will work on active entity
public async draftMethodAndNonDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
// FOR DRAFT
this.after('UPDATE', 'MyEntity.drafts', async (req: Request) => {
  return this.customerService.testExample(req)
})

// FOR ACTIVE ENTITIES
this.after(['CREATE', 'READ'], 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

`Example 3`

`Alternative to all above is to split between` `@Draft` and `Active entities`.

```typescript
@BeforeUpdate()
@BeforeCreate()
@AfterRead()
@Draft() // All above decorators will be marked as draft
public async draftMethod(req: Request) {
   return this.customerService.testExample( req)
}

// All decorators will work only on the active entity.
@BeforeUpdate()
@BeforeCreate()
@AfterRead()
public async methodWithoutDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
// FOR DRAFT
this.before(['UPDATE', 'CREATE'], 'MyEntity.drafts', async (req: Request) => {
  return this.customerService.testExample(req)
})

// FOR DRAFT
this.after('READ', 'MyEntity.drafts', async (req: Request) => {
  return this.customerService.testExample(req)
})

// FOR ACTIVE ENTITIES
this.before(['UPDATE', 'CREATE'], 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})

this.after('READ', 'MyEntity', async (req: Request) => {
  return this.customerService.testExample(req)
})
```

###### OnActionDraft

**@OnActionDraft()**(`name` : `string`)

`Parameters`

- `name (string)` : Representing the `CDS action name` defined in the `CDS file`

`Example`

```typescript
@OnActionDraft('boundActionOrFunction')
public async onActionDraftMethod(req: Request) {
   return this.customerService.testExample( req)
}

```

`@OnActionDraft('boundActionOrFunction')` will use always point to `Handler entity argument` which represents a specific `CDS entity`, and the origin of this can be traced back to the [EntityHandler](#entityhandler) => `@EntityHandler('MyEntity')`

`Equivalent to 'JS'`

```typescript
this.on('boundActionOrFunction', 'MyEntity.drafts' async (req: Request) => {
  return this.customerService.testExample(req)
})
```

###### OnNewDraft

**@OnNewDraft()**

This decorator will be triggered when `a new draft is created`.

`Example`

```typescript
@OnNewDraft()
public async onNewDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('NEW', 'MyEntity.drafts' async (req: Request) => {
  return this.customerService.testExample(req)
})
```

###### OnCancelDraft

**@OnCancelDraft()**

This decorator will be triggered when `a draft is cancelled`.

`Example`

```typescript
@OnCancelDraft()
public async onCancelDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('CANCEL', 'MyEntity.drafts' async (req: Request) => {
  return this.customerService.testExample(req)
})
```

###### OnEditDraft

**@OnEditDraft()**

This decorator will be triggered when `a new draft is created from an active instance`

`Example`

```typescript
@OnEditDraft()
public async onEditDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('EDIT', 'MyEntity' async (req: Request) => {
  return this.customerService.testExample(req)
})
```

###### OnSaveDraft

**@OnSaveDraft()**

This decorator will be triggered when `the active entity is changed`

`Example`

```typescript
@OnSaveDraft()
public async onSaveDraft(req: Request) {
   return this.customerService.testExample( req)
}
```

`Equivalent to 'JS'`

```typescript
this.on('SAVE', 'MyEntity' async (req: Request) => {
  return this.customerService.testExample(req)
})
```

### Example

TODO

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
