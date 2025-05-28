---
applyTo: "**/*.{ts,tsx}"
---

## Project Context

This is a Typescript project using react and Node.js with Express.
This is like a mono repo setup.

## Coding Style

Do not use useless comments. Code should be self-explanatory as much as possible.
For React Bootstrap components, use the `react-bootstrap` library and import specific components per file. Example: `react-bootstrap/Button`.
Use react styles when possible for styling components.

## Project Structure

The project is structured as follows:

```
client/           # Contains the React client application and is the public dir for html
  src/            # Source code for the client and subdirectories can be accessed using `client/**`
    components/   # General React Components not specific to a page
    **/           # Other directories are added for specific pages or features

common/           # Contains shared code between client and server. Can be accessed using `common/**`
  api/            # Shared API interfaces and types
  models/         # Shared database models for client and server

server/           # Contains the Node.js server application. Can be accessed using `server/**`
  api/            # Express api routes
    **/           # Feature specific routes
  database/       # Database models
  forms/          # Hosted site forms
```

## DB models

The database models are defined in the `common/models` directory.
They are in most cases classes that extend a base `Model` class. In this case, they will always match the database structure.
In some cases they are interfaces. Especially used for simplified lists and when data doesn't match the database structure.

## Tests

Testing is done using `vitest` with a file.test.ts naming convention.
