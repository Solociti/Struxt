---
applyTo: "**/*.{ts,tsx}"
---

## Project Context

For high-level architecture, environment setup (Docker), and full-stack workflows, refer to [`.github/copilot-instructions.md`](../copilot-instructions.md).

This is a Typescript project using react and Node.js with Express.
This is like a mono repo setup.

## Coding Style

Do not use useless comments. Code should be self-explanatory as much as possible.
DO NOT GENERATE ANY COMMENTS ANYWHERE with exception to jsdoc comments.
Every function should have a jsdoc comment explaining what it does and its parameters.
Parameter descriptions: include `@param` descriptions only when the parameter name does not fully describe its purpose; otherwise omit the description to keep comments concise.
**`@param` format**: Write `@param name description` — never use a dash between the name and description (e.g. never `@param name - description`).
**`@param` descriptions**: Keep descriptions as short as possible. Prefer a single example over a long prose description (e.g. `@param path e.g. \`/v1/archive\``). Never describe what is already obvious from the parameter name or type.
Root level react components should always be defined as functional components. Not arrow functions.
For React Bootstrap components, ALWAYS use default imports from the specific component path (e.g., `import ListGroup from "react-bootstrap/ListGroup"`). Do NOT use destructuring imports (e.g., `import { ListGroup } from "react-bootstrap"`).
Use react styles when possible for styling components.

### Formatting Rules

- **Braces**: Always use braces for if statements, even single-line blocks. Opening brace on same line, closing brace on new line.
- **Multi-line blocks**: Always format if-return statements with proper indentation:
  ```typescript
  if (condition) {
    return value;
  }
  ```
  NOT: `if (condition) return value;` or `if (condition) { return value; }`
- **Indentation**: Use 2 spaces (consistent with project style).
- **Line breaks**: Each statement should be on its own line for readability.

## Imports

- **Path Aliases**: Always use `common/*`, `server/*`, `client/*`.
- **Forbidden**: Relative imports traversing up to root (e.g., `../../../common`).

## Server Development

- **Database Access**: Use `getCollection<T>(CollectionNames)` from `server/database/mongodb.ts`. Do not use raw drivers or manual instantiation.
- **Error Handling**: Throw `StructuredError` (from `common/custom-error`) for handled operational errors.
- **Security**: Wrap all API routes with `protectEndpoint` from `server/auth/protectEndpoint`.
- **API Contract**: All endpoints must implement interfaces from `common/api/api.ts` to share types with the client.

## Components

Components are located in the `client/src/components` directory.
For buttons prefer using the `<IconButton />` component from `client/components/IconButton`.
For icons use the `<MaterialIcon />` component from `client/components/MaterialIcon`.
For a modal use the `<SimpleModal />` component from `client/components/modals/SimpleModal`.
Use the `<ShowError />` component from `client/components/ShowError` to display errors.

## DB models

The database models are defined in the `common/models` directory.

- **Classes**: Models extending the base `Model` class should be used for business logic and validation before database insertion. They match the DB structure.
- **Interfaces**: Use interfaces for simplified lists or DTOs when data doesn't strictly match the database structure.

## Tests

Testing is done using `vitest` with a file.test.ts naming convention.
