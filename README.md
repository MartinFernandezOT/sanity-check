# Sanity Check

## Installation

1. In your `app.js` file on `nodejs-rest-client-library/lib/VVRestApi/VVRestApiNodeJs/` add the following line just before the route handlers:

```js
// Test Sanity Check
app.get('/sanity-check', require('./sanity-check'))
```

2. In the same path, add the file `sanity-check.js`.
3. Change the credentials to the correct ones on:

```js
const V5_DEV_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 Dev',
};
const V5_SANDBOX_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 Sandbox',
};
const V5_QA_CREDENTIALS = {
    customerAlias: '',
    databaseAlias: '',
    userId: '',
    password: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
    environmentName: 'V5 QA',
};
```

## Configuration

1. Change the `migrationFrom` variable's value to the environment where the migration was originated.
2. Change the `migrationTo` variable's value to the environment where the migration occurred.
3. Adjust the variable `formsToCheck` to the form template names that need to match.

## Run

1. Run the local debugging as usual
2. Navigate on the browser to `http://localhost:3000/sanity-check`