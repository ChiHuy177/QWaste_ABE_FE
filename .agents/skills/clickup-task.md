Write a ClickUp task description for a QWaste Platform feature following the unified USER STORY & REQUIREMENT TEMPLATE below.

## Feature context

$ARGUMENTS

If `$ARGUMENTS` is empty, ask the user: "Mô tả feature/domain cần viết task description (ví dụ: 'Order create — tạo đơn hàng mới với validation, permission check, và localized message')." Do not proceed until you have enough context to fill in the template accurately.

If `$ARGUMENTS` is provided, proceed directly to producing the description without asking preliminary questions. You may ask targeted clarifying questions mid-way only if a specific section cannot be written without more information (e.g., exact error codes, localization messages, or UI fields are unknown).

---

## Writing style rules (strictly follow these)

- Write for **Testers and Frontend Developers** — avoid referencing internal implementation details (e.g., class names, method names, annotations, or service layer logic).
- Describe **what the system does**, not **how it does it** internally.
- Keep each bullet point short and focused on one behavior.
- Use inline code formatting (backticks) for: HTTP status codes, field names, language values, system codes, and endpoint paths.
- Use **bold** only for entity names and section sub-headings, not for general emphasis.
- Localization: language is always resolved from `Language of UserSetting` (`en` / `vi`). Default fallback is `en`.
- GET endpoints return `message: null` — never write a Localization Mapping for them.
- Do not reference Spring Boot, MapStruct, JPA, Redis, Caffeine, or any framework internals.

---

## Template (fill in all bracketed placeholders — remove placeholder text in final output)

---

### 📑 USER STORY [X]: [FEATURE/API NAME] ([READ / CREATE / UPDATE / DELETE / SYSTEM])

**User Story:**
> **As a** [User Role or API Consumer — e.g., Shop Manager, Admin, Frontend Developer, Client Application],
> **I want** [Specific action or system behavior],
> **So that** [Core value or benefit derived from this behavior].

---

### 💡 Crucial Business Logic (Special Notes for Dev & Tester)
*(Fill this section only if there are hidden business rules, constraint logic, localization requirements, or permission rules that are not obvious from the functional requirements alone. Omit the section entirely if there is nothing non-obvious.)*

* **Processing Logic & System Constraints:** [e.g., Constraint check must happen before delete. If active references exist, delete is rejected with a structured error response.]
* **Localization & Formatting:** [e.g., Language detection via Language of UserSetting (`en` / `vi`). Default fallback language is `en`.]
* **Permissions / Authorization:** [e.g., Only users with the `Space.DELETE` permission can trigger this action.]

---

### 🎨 Design / Documentation (Design/Docs)
* **[Documentation/Design Link]:** [Insert Figma screen link, Swagger/OpenAPI spec link, or docs page reference here]

---

### ⚙️ Functional Requirements

#### 📋 Category A: UI & Screen Features (omit if no UI involvement)

* **Display / List View:**
    * Display in a data table (Table) consisting of the following columns: `[Column 1]`, `[Column 2]`...
    * Allow quick search by: `[Field 1]` or `[Field 2]`.
    * Allow filtering (Filter) by: `[Criteria 1]`.
    * Pagination: `[X]` records per page.
* **Input Form / Data Submission:**
    * `[Field Name 1]`: [Generation: Auto/Manual] — [Constraint: Mandatory/Optional] — [Component: Input text, Dropdown, Textarea, etc.].
    * `[Field Name 2]`: [Attribute: Read-only/Editable] — [Constraint: Max length X].

---

#### ⚙️ Category B: Backend, API & System Features

*(Group related behaviors under named Cases. Each Case = one distinct scenario or error condition. Always include a Localization Mapping block under each Case that returns a user-facing message. For GET endpoints, write "N/A — GET endpoints return `message: null`." For JSON response contracts, provide the full structure under both `En` and `Vi` sub-blocks. Never describe internal implementation.)*

---

**Case 1: [Short descriptive name — e.g., Entity deletion blocked — related records exist]**

* When a user attempts to [action] a **[Entity A]** that [condition], the system [outcome].
* The response must include: [describe returned fields].
* **Localization Mapping:**

En :
```json
{
  "code": 0,
  "message": "[English message here]",
  "result": {
    "entityType": "[EntityType]",
    "[entityNameField]": "[Example Name]",
    "[relatedCountField]": 0
  }
}
```

Vi :
```json
{
  "code": 0,
  "message": "[Vietnamese message here]",
  "result": {
    "entityType": "[EntityType]",
    "[entityNameField]": "[Example Name]",
    "[relatedCountField]": 0
  }
}
```

---

**Case 2: [Short descriptive name]**

* [Description of scenario]
* **Localization Mapping:**

En : `"message": "[English message here]"`

Vi : `"message": "[Vietnamese message here]"`

---

*(Use full JSON block when response includes a structured `result` object. Use inline string when response is a plain message field only.)*

---

### 🧪 Acceptance Criteria (BDD Format)

*(Each AC maps to one Case or one language variant of a Case. Write in detail using BDD structure to help QA/Testers generate test cases for UI states or API payloads.)*

* **AC 1 ([Scenario name — e.g., Entity blocked — English]):**
  * `Given` [Initial context or system state],
  * `When` [Action triggered by user or client application],
  * `Then` [Expected HTTP status, system code, message language, and response body structure].

* **AC 2 ([Scenario name — e.g., Entity blocked — Vietnamese]):**
  * `Given` [...],
  * `When` [...],
  * `Then` [...].

* **AC 3 ([Scenario name — e.g., Success]):**
  * `Given` [...],
  * `When` [...],
  * `Then` [...].

* **AC 4 ([Scenario name — e.g., Language fallback]):**
  * `Given` the Language of UserSetting is absent or set to an unsupported value,
  * `When` any error response is triggered,
  * `Then` the system must return all message fields in English (`en`) by default.

* **AC 5 ([Scenario name — e.g., Entity not found]):**
  * `Given` the target entity does not exist,
  * `When` the user attempts the action,
  * `Then` the system must return `HTTP 404 Not Found` before any constraint check occurs.

---

**Note:**
> Keep descriptions short and clear — written for Testers, not for Developers.
> Message language is always resolved from the Language of UserSetting (`en` / `vi`). Default fallback is `en`.
> Do not reference internal class names, method names, or framework-specific behavior in task descriptions.

---

## Output instructions

Produce the final description as a clean markdown block ready to copy-paste into ClickUp. Remove all bracketed placeholder text and template instructions from the output. Only include sections that are relevant — omit Category A entirely if there is no UI involvement, and omit Crucial Business Logic if there is nothing non-obvious to note.
