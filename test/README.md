# Testing

- [Testing](#testing)
  - [Installation](#installation)
    - [Run unit/integration tests](#run-unitintegration-tests)
    - [Run e2e tests](#run-e2e-tests)

## Installation

To test the project go to the `root` of `(cds-ts-dispatcher)` and run :

```bash
npm install
```

### Run unit/integration tests

Go to the `root` folder and run :

```bash
npm run test
```

Check if all tests are completed;

### Run e2e tests

Go to the `root` folder and run :

```bash
npm run start:bookshop
```

In a separate terminal run :

```bash
npm run test:newman
```

Check if all tests are completed.
If you want to run again the `e2e` tests first you have to restart the server and then run again `test:newman`
