# TypeScript Architecture & Clean Code Rules

## Core Principles

This project prioritizes:

* maintainability
* modularity
* strong typing
* predictable structure
* separation of concerns
* scalable architecture

Code generation should optimize for long-term readability, NOT short-term convenience.

---

# 1. Import Rules

## Mandatory

* ALL imports MUST be at the top of the file
* NEVER import inside functions
* NEVER use dynamic imports unless explicitly required
* Group imports:

  1. external libraries
  2. internal modules
  3. relative imports

Example:

```ts
import express from "express";
import mongoose from "mongoose";

import { AppError } from "@/core/errors";
import { UserService } from "@/services/user.service";

import "./config";
```

---

# 2. Type Organization Rules

## NEVER declare large inline object types

BAD:

```ts
const user: {
  id: string;
  email: string;
  profile: {
    avatar: string;
  };
}
```

GOOD:

```ts
import { User } from "@/types/user.types";

const user: User;
```

---

# 3. Shared Types

## Shared types MUST be extracted into `/types`

Project structure:

```text
src/
  types/
    api.types.ts
    user.types.ts
    auth.types.ts
    common.types.ts
```

Rules:

* reusable interfaces belong in `/types`
* reusable enums belong in `/types`
* reusable DTOs belong in `/types`
* reusable response models belong in `/types`

---

# 4. Constants Organization

## NEVER hardcode repeated values

BAD:

```ts
if (status === "ACTIVE")
```

GOOD:

```ts
import { USER_STATUS } from "@/constants/user.constants";

if (status === USER_STATUS.ACTIVE)
```

---

# 5. Constants Structure

Project structure:

```text
src/
  constants/
    api.constants.ts
    auth.constants.ts
    user.constants.ts
```

Rules:

* all magic strings must become constants
* all repeated numbers must become constants
* environment keys should be centralized
* route names should be centralized

---

# 6. Function Size Rules

Functions should:

* do ONE responsibility
* remain under ~40 lines when possible
* extract helpers when complexity grows

BAD:

* validation
* transformation
* database logic
* response formatting

inside one function.

---

# 7. Service Layer Rules

Business logic MUST NOT exist inside:

* controllers
* routes
* React components

Business logic belongs in:

* services
* use-cases
* domain modules

---

# 8. Type Safety Rules

## Forbidden

* any
* unknown abuse
* implicit return types
* untyped JSON parsing

## Required

* explicit interfaces
* typed responses
* typed params
* typed service contracts

---

# 9. File Responsibility Rules

Each file should have ONE clear responsibility.

BAD:

```text
user.service.ts
- validation
- database
- cache
- email
- queue
```

GOOD:

```text
user.service.ts
user.validation.ts
user.repository.ts
user.mapper.ts
```

---

# 10. Naming Conventions

## Types

```ts
User
CreateUserRequest
UpdateUserDto
ApiResponse
```

## Constants

```ts
USER_STATUS
HTTP_STATUS
MAX_RETRY_COUNT
```

## Files

```text
user.service.ts
user.repository.ts
user.types.ts
```

---

# 11. Clean Architecture Rules

Prefer:

* dependency injection
* repositories
* service abstraction
* DTO mapping
* domain separation

Avoid:

* tightly coupled modules
* giant utility files
* business logic in controllers
* duplicated schemas

---

# 12. Final Validation Checklist

Before generating code, verify:

* [ ] imports at top
* [ ] no inline large types
* [ ] reusable types extracted
* [ ] constants centralized
* [ ] no magic strings
* [ ] functions small and focused
* [ ] business logic separated
* [ ] type-safe implementation
* [ ] clean file naming
* [ ] scalable structure maintained

---

# Critical Failure Conditions

The following are considered architecture violations:

* imports inside functions
* duplicated interfaces
* inline complex object typing
* magic strings
* business logic in controllers
* giant files with multiple responsibilities
* use of `any`
* repeated hardcoded values

If detected:

* refactor before finalizing code.
