---
name: comments
description: Rules for generating JSDoc and internal comments in the codebase.
---

# JSDoc and Comments Skill

Follow these rules when generating or editing JSDoc and comments in this project.
Always apply this skill when adding or modifying comments in the codebase.
Do not modify comments that are unrelated to the work you are doing, unless explicitly requested by the user.

## TODO Handling

- Do not modify TODO comments unless explicitly requested by the user.

## Minimalist Comments

- **No Useless Comments**: Do not use useless comments. Code should be self-explanatory whenever possible.
- **Selective Commenting**: Do NOT generate any comments anywhere EXCEPT for JSDoc comments. Only insert internal comments if the code's action is complex and cannot be clearly described by the code itself.
- **No Over-description**: Never insert comments where the code describes the actions better than a comment.
- **No Numbering**: Do not number comments or steps (e.g., "1. Do this, 2. Do that").
- **Conciseness**: Keep all comments and descriptions as short as possible. Avoid useless text or prose.

## JSDoc Rules

- **Mandatory JSDoc**: Every function and method MUST have a JSDoc comment explaining its purpose and parameters.
  - **Documentation Comments**: Always use the three-line JSDoc format:
  ```js
  /**
   * Description
   *
   * @param name
   */
  ```
  or
  ```js
  /**
   * Description
   */
  ```
  for documenting code elements (variables, constants, interfaces, types, properties, functions, methods), even for single-line descriptions. Do not use single-line `/** ... */` comments.
- **Inline Comments**: Use `//` for regular inline comments that explain code logic (not documentation).
- **Format `@param`**: Follow the format: `@param name description`. NEVER use a dash (e.g., `-`) between the name and description.
- **Concise `@param` descriptions**:
  - Include descriptions only when the parameter name does not fully describe its purpose; otherwise, omit the description.
  - Never describe what is already obvious from the parameter name or type.
- **Examples over Prose**: Prefer a single example over a long prose description (e.g., `@param path e.g. /v1/archive`).
