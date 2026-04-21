# Requirements Document

## Introduction

ASEAN International DMCC is a marine fuel (bunker) trading company based in Dubai. This document specifies the requirements for a greenfield mobile-first web application that enables the ASEAN team to fill out a multi-step form and instantly generate two PDF documents per transaction: a **Bunker Nomination** (sent to the fuel supplier/trader) and an **Order Confirmation** (sent to the buyer/client). The application also persists completed transactions to MongoDB Atlas for historical review and re-export, and deploys to Vercel.

The tech stack is Next.js 14 (App Router, TypeScript), shadcn/ui, React Hook Form + Zod, Zustand with persist middleware, next-themes, @react-pdf/renderer for server-side PDF generation, the xlsx package for client-side Excel export, and the official MongoDB Node.js driver with connection caching.

## Glossary

- **App**: The ASEAN Document Generator web application built with Next.js 14 App Router
- **Form_Wizard**: The 4-step multi-step form component that guides the user through data entry
- **Step_Progress_Indicator**: The horizontal numbered step bar at the top of the form showing current step, completed steps, and total steps
- **Step_1_Transaction_Details**: The first form step containing shared transaction fields (Date, Vessel Name & IMO, Port, ETA, Product, Quantity, Delivery Mode, Agents, Physical Supplier, Signatory)
- **Step_2_Bunker_Nomination**: The second form step containing supplier-specific fields (To, Attn, Sellers, Suppliers, Buying Price, Supplier Payment Terms, Supplier Remarks)
- **Step_3_Order_Confirmation**: The third form step containing buyer-specific fields (To, Attn, Buyers, Selling Price, Buyer Payment Terms, Buyer Remarks)
- **Step_4_Review_Export**: The fourth form step displaying a read-only summary of all entered data with export action buttons
- **Form_Store**: The Zustand store with persist middleware (localStorage) that holds all form field values across steps
- **Zod_Schema**: A per-step Zod validation schema that defines required fields and validation rules for each form step
- **PDF_API_Route**: The Next.js API route at `/api/generate-pdf` that accepts form data and document type, renders a PDF server-side using @react-pdf/renderer, and returns the PDF blob
- **Transactions_API_Route**: The Next.js API route at `/api/transactions` that handles GET (list all) and POST (save new) operations against MongoDB Atlas
- **BN_Document**: The Bunker Nomination PDF document rendered by @react-pdf/renderer with supplier-facing content and layout
- **OC_Document**: The Order Confirmation PDF document rendered by @react-pdf/renderer with buyer-facing content and layout
- **Excel_Export_Module**: The client-side module using the xlsx package that generates a single .xlsx file with two sheets
- **MongoDB_Client**: The cached MongoDB Node.js driver connection instance using the `global._mongoClientPromise` pattern for Vercel serverless
- **Transaction_Record**: A document in the MongoDB `transactions` collection containing all form fields and a `createdAt` timestamp
- **History_Page**: The `/history` route that displays all saved transactions in a list sorted by most recent
- **Theme_Toggle**: The dark/light mode toggle button in the top navigation bar using next-themes
- **Top_Navigation_Bar**: The top bar containing the ASEAN brand text, app name, and Theme_Toggle
- **Sticky_Action_Bar**: The bottom-fixed bar containing Back, Next, and export action buttons
- **Toast_Notification**: A shadcn toast component used to display success or error feedback to the user

## Requirements

### Requirement 1: Multi-Step Form Wizard

**User Story:** As an ASEAN team member, I want to enter transaction data through a guided multi-step form, so that I can complete nominations and order confirmations efficiently without being overwhelmed by a single long form.

#### Acceptance Criteria

1. WHEN the user navigates to the `/form` route, THE Form_Wizard SHALL present Step_1_Transaction_Details as the initial active step.
2. THE Step_Progress_Indicator SHALL display 4 numbered steps with a connecting line, highlighting the active step in brand blue (#1d4ed8) and showing a checkmark icon on completed steps.
3. WHEN the user is on any step, THE Form_Wizard SHALL render the step content inside a shadcn Card component with a CardHeader (step title and description) and CardContent (form fields).
4. WHEN the user navigates to the root path `/`, THE App SHALL redirect the user to the `/form` route.

### Requirement 2: Step 1 — Transaction Details Fields

**User Story:** As an ASEAN team member, I want to enter shared transaction details in the first step, so that common data is captured once and reused across both documents.

#### Acceptance Criteria

1. THE Step_1_Transaction_Details SHALL display the following fields in order: Date, Vessel Name & IMO, Port, ETA, Product, Quantity, Delivery Mode, Agents, Physical Supplier, Signatory.
2. THE Step_1_Transaction_Details SHALL mark all fields as required except Signatory.
3. WHEN the Signatory field is left empty, THE Form_Store SHALL default the Signatory value to "Sahir Jamal".
4. THE Step_1_Transaction_Details SHALL use shadcn FormField, FormItem, FormLabel, FormControl, and FormMessage wrappers around shadcn Input, Textarea, and Select components for each field.

### Requirement 3: Step 2 — Bunker Nomination Fields

**User Story:** As an ASEAN team member, I want to enter supplier-specific details in the second step, so that the Bunker Nomination document contains the correct supplier-facing information.

#### Acceptance Criteria

1. THE Step_2_Bunker_Nomination SHALL display the following fields in order: To (company), Attn (contact name), Sellers, Suppliers, Buying Price, Supplier Payment Terms, Supplier Remarks.
2. THE Step_2_Bunker_Nomination SHALL mark To, Attn, Sellers, and Buying Price as required fields.
3. THE Step_2_Bunker_Nomination SHALL allow Suppliers, Supplier Payment Terms, and Supplier Remarks to be optional.

### Requirement 4: Step 3 — Order Confirmation Fields

**User Story:** As an ASEAN team member, I want to enter buyer-specific details in the third step, so that the Order Confirmation document contains the correct buyer-facing information.

#### Acceptance Criteria

1. THE Step_3_Order_Confirmation SHALL display the following fields in order: To (company), Attn (contact name), Buyers, Selling Price, Buyer Payment Terms, Buyer Remarks.
2. THE Step_3_Order_Confirmation SHALL mark To, Attn, Buyers, and Selling Price as required fields.
3. THE Step_3_Order_Confirmation SHALL allow Buyer Payment Terms and Buyer Remarks to be optional.

### Requirement 5: Step 4 — Review and Export

**User Story:** As an ASEAN team member, I want to review all entered data and access export actions in the final step, so that I can verify accuracy before generating documents.

#### Acceptance Criteria

1. THE Step_4_Review_Export SHALL display two shadcn Card components: one titled "Bunker Nomination Summary" and one titled "Order Confirmation Summary".
2. WHILE the viewport width is 768px or greater, THE Step_4_Review_Export SHALL display the two summary cards side by side.
3. WHILE the viewport width is less than 768px, THE Step_4_Review_Export SHALL stack the two summary cards vertically.
4. THE Step_4_Review_Export SHALL display each field as a label/value row within the appropriate summary card.
5. THE Step_4_Review_Export SHALL display 4 action buttons: "Save Transaction" (primary color, FiSave icon), "Download Bunker Nomination PDF" (purple, FiFileText icon), "Download Order Confirmation PDF" (blue, FiFile icon), and "Download Excel" (green, FiGrid icon).
6. WHILE the viewport width is less than 768px, THE Step_4_Review_Export SHALL stack the 4 action buttons vertically at full width.
7. WHILE the viewport width is 768px or greater, THE Step_4_Review_Export SHALL display the 4 action buttons in a horizontal row.

### Requirement 6: Form Validation and Auto-Scroll

**User Story:** As an ASEAN team member, I want the form to prevent me from advancing when required fields are missing, so that I do not generate incomplete documents.

#### Acceptance Criteria

1. WHEN the user taps "Next" on any step, THE Form_Wizard SHALL validate all fields on the current step against the corresponding Zod_Schema.
2. IF validation fails, THEN THE Form_Wizard SHALL scroll to the first invalid field using the field ref from React Hook Form.
3. IF validation fails, THEN THE Form_Wizard SHALL highlight the first invalid field with a red border and display an inline error message below the field using the shadcn FormMessage component.
4. IF validation fails, THEN THE Form_Wizard SHALL remain on the current step and not advance to the next step.
5. WHEN validation passes, THE Form_Wizard SHALL advance to the next step.

### Requirement 7: Step Navigation

**User Story:** As an ASEAN team member, I want to navigate back and forth between form steps, so that I can review and correct previously entered data.

#### Acceptance Criteria

1. WHILE the user is on Step 2, Step 3, or Step 4, THE Sticky_Action_Bar SHALL display a "Back" button.
2. WHEN the user taps the "Back" button, THE Form_Wizard SHALL return to the previous step with all previously entered data intact in the Form_Store.
3. WHILE the user is on Step 1, THE Sticky_Action_Bar SHALL not display a "Back" button.
4. WHILE the user is on Step 1, Step 2, or Step 3, THE Sticky_Action_Bar SHALL display a "Next" button.
5. WHILE the user is on Step 4, THE Sticky_Action_Bar SHALL not display a "Next" button and SHALL instead display the export action buttons.

### Requirement 8: Persistent Form State

**User Story:** As an ASEAN team member, I want my partially completed form data to be preserved if I close the browser, so that I do not lose my work.

#### Acceptance Criteria

1. THE Form_Store SHALL use Zustand persist middleware with localStorage as the storage backend.
2. WHEN the user enters or modifies any form field value, THE Form_Store SHALL persist the updated value to localStorage.
3. WHEN the user returns to the App after closing the browser or navigating away, THE Form_Store SHALL restore all previously entered field values from localStorage.
4. WHEN the user completes a transaction export or save, THE Form_Store SHALL provide a mechanism to clear all persisted form data and reset the form to its initial state.

### Requirement 9: Bunker Nomination PDF Generation

**User Story:** As an ASEAN team member, I want to download a Bunker Nomination PDF, so that I can send it to the fuel supplier/trader.

#### Acceptance Criteria

1. WHEN the user taps "Download Bunker Nomination PDF" on Step_4_Review_Export, THE App SHALL send a POST request to the PDF_API_Route with `{type: 'bn', data: <form_data>}`.
2. WHEN the PDF_API_Route receives a request with type `bn`, THE PDF_API_Route SHALL render the BN_Document using @react-pdf/renderer server-side and return the PDF as a downloadable blob.
3. THE BN_Document page 1 SHALL display: the ASEAN header (logo left, company address right including "EMAIL: bunkers@asean.ae"), centered title "Bunker Nomination", fields To/Attn/Date, bold tagline "We are pleased to place the following order confirmation with you:", Vessel field (label "Vessel:" with colon), sub-lines "AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR" and "ASEAN INTERNATIONAL DMCC", then Port, ETA, Product, Quantity, Price, Delivery mode, Sellers (from form input), Buyers ("Asean International DMCC" hardcoded), Suppliers (from form input), Agents, Payment, Remarks (default "-"), "Kind regards", and signatory name.
4. THE BN_Document page 2 SHALL display: the same ASEAN header, bold underlined "NOTES" section with all specified operations contact details and supplier instructions, bold underlined "REMARKS" section with BIMCO 2018 terms text, and an italic centered footer with border-top reading "*Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com".
5. THE BN_Document SHALL reproduce all boilerplate text exactly as specified in the document spec without alteration.

### Requirement 10: Order Confirmation PDF Generation

**User Story:** As an ASEAN team member, I want to download an Order Confirmation PDF, so that I can send it to the buyer/client.

#### Acceptance Criteria

1. WHEN the user taps "Download Order Confirmation PDF" on Step_4_Review_Export, THE App SHALL send a POST request to the PDF_API_Route with `{type: 'oc', data: <form_data>}`.
2. WHEN the PDF_API_Route receives a request with type `oc`, THE PDF_API_Route SHALL render the OC_Document using @react-pdf/renderer server-side and return the PDF as a downloadable blob.
3. THE OC_Document page 1 SHALL display: the ASEAN header (logo left, company address right with "bunkers@asean.ae" without "EMAIL:" prefix), centered title "ORDER CONFIRMATION", fields To/Attn/Date, bold tagline "We are pleased to confirm the following nomination with you:", Vessel field (label "Vessel" without colon), sub-lines "AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR" and the buyer's company name (from oc_buyers input), then Port, ETA, Product, Quantity, Price, Delivery Mode, Sellers ("Asean International DMCC" hardcoded), Buyers (from form input), Supplier (singular label, value from physical_supplier), Agents, Remarks (label with colon), Payment, "Kind regards", and signatory name.
4. THE OC_Document page 2 SHALL display: the same ASEAN header, bold underlined "NOTES" section with operations contact and confirmation request text, bold underlined "REMARKS" section with all six italic remark lines (BIMCO terms, weather condition, barge sounding, cancellation charges, interest on late payment, Iran warranty), and an italic centered footer without asterisk reading "Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com".
5. THE OC_Document SHALL reproduce all boilerplate text exactly as specified in the document spec without alteration.

### Requirement 11: Excel Export

**User Story:** As an ASEAN team member, I want to download an Excel file containing both document summaries, so that I can share transaction data in spreadsheet format.

#### Acceptance Criteria

1. WHEN the user taps "Download Excel" on Step_4_Review_Export, THE Excel_Export_Module SHALL generate a single .xlsx file client-side using the xlsx package.
2. THE generated .xlsx file SHALL contain two sheets: one named "Bunker Nomination" and one named "Order Confirmation".
3. THE "Bunker Nomination" sheet SHALL contain all transaction fields relevant to the Bunker Nomination document populated with the current form data.
4. THE "Order Confirmation" sheet SHALL contain all transaction fields relevant to the Order Confirmation document populated with the current form data.
5. WHEN the .xlsx file is generated, THE App SHALL trigger an automatic browser download of the file.

### Requirement 12: Save Transaction to Database

**User Story:** As an ASEAN team member, I want to save completed transactions to a database, so that I can access them later for reference or re-export.

#### Acceptance Criteria

1. WHEN the user taps "Save Transaction" on Step_4_Review_Export, THE App SHALL send a POST request to the Transactions_API_Route with the full form data.
2. WHEN the Transactions_API_Route receives a POST request, THE Transactions_API_Route SHALL insert a Transaction_Record into the MongoDB `transactions` collection with all form fields and a `createdAt` timestamp set to the current date and time.
3. WHEN the transaction is saved successfully, THE App SHALL display a success Toast_Notification to the user.
4. IF the MONGODB_URI environment variable is not set, THEN THE Transactions_API_Route SHALL log the transaction payload to the server console and return a success response indicating mock mode.
5. THE MongoDB_Client SHALL use the `global._mongoClientPromise` caching pattern to avoid exhausting connections on Vercel serverless.
6. THE Transactions_API_Route SHALL reference `process.env.MONGODB_URI` exclusively and SHALL NOT contain any hardcoded database credentials.

### Requirement 13: Transaction History

**User Story:** As an ASEAN team member, I want to view a list of previously saved transactions, so that I can review past deals and re-export documents.

#### Acceptance Criteria

1. WHEN the user navigates to the History_Page at `/history`, THE History_Page SHALL fetch all saved transactions from the Transactions_API_Route via a GET request.
2. THE History_Page SHALL display the transactions in a list sorted by most recent `createdAt` first.
3. THE History_Page SHALL show the following fields for each transaction: Vessel name, Port, Date, Buyer company (from oc.to), and Supplier company (from bn.to).
4. THE History_Page SHALL display a "Re-export" button on each transaction row.
5. WHEN the user taps the "Re-export" button on a transaction, THE App SHALL populate the Form_Store with that transaction's data and navigate the user to Step_4_Review_Export.
6. IF the MONGODB_URI environment variable is not set, THEN THE Transactions_API_Route GET handler SHALL return an empty array and log a message indicating mock mode.

### Requirement 14: Dark and Light Mode

**User Story:** As an ASEAN team member, I want the app to support dark and light modes, so that I can use it comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the App loads for the first time and the system color scheme preference is dark, THE App SHALL render in dark mode.
2. WHEN the App loads for the first time and the system color scheme preference is light, THE App SHALL render in light mode.
3. THE Top_Navigation_Bar SHALL display a Theme_Toggle button with a FiSun icon in dark mode and a FiMoon icon in light mode.
4. WHEN the user taps the Theme_Toggle, THE App SHALL switch between dark and light mode.
5. WHEN the user selects a theme preference via the Theme_Toggle, THE App SHALL persist the preference in localStorage and apply the persisted preference on subsequent visits.
6. THE App SHALL use the brand color variables: primary (#1d4ed8), brand teal (#0e7490), dark background (#0b1120), card background dark (#111c30), and border dark (#1e3a5f) configured via shadcn CSS theming.

### Requirement 15: Mobile-First Responsive Design

**User Story:** As an ASEAN team member, I want the app to be fully usable on my mobile phone, so that I can create nominations and confirmations on the go.

#### Acceptance Criteria

1. THE App SHALL be fully usable on a viewport width of 375px without horizontal scrolling at any breakpoint.
2. THE App SHALL render all input fields with a minimum tap target height of 48px and a font-size of 16px to prevent iOS auto-zoom.
3. THE App SHALL render all buttons at full width on viewports below 768px with a minimum height of 48px.
4. THE Step_Progress_Indicator SHALL condense its layout on viewports below 768px to fit within the available width without horizontal overflow.
5. THE Sticky_Action_Bar SHALL remain fixed at the bottom of the viewport on all screen sizes, providing persistent access to Back, Next, and export actions.

### Requirement 16: Application Shell and Navigation

**User Story:** As an ASEAN team member, I want a consistent navigation shell, so that I can easily access the form and history sections of the app.

#### Acceptance Criteria

1. THE Top_Navigation_Bar SHALL display the ASEAN brand text ("ASEAN" in brand teal color) as a placeholder logo, the app name "Document Generator", and the Theme_Toggle button.
2. THE Top_Navigation_Bar SHALL provide navigation access to the form page (`/form`) and the history page (`/history`).
3. THE App SHALL use Next.js App Router for all routing with no Pages Router usage.

### Requirement 17: Project Structure and Configuration

**User Story:** As a developer, I want a well-organized project structure with proper configuration, so that the codebase is maintainable and deployable.

#### Acceptance Criteria

1. THE App SHALL organize source code into the following directory structure: `/app` (pages and API routes), `/components` (UI components organized by feature), `/lib` (utilities and store), `/types` (TypeScript interfaces).
2. THE App SHALL include a `.env.local.example` file containing the placeholder `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/asean_dmcc?retryWrites=true&w=majority`.
3. THE App SHALL store all form state in the Form_Store using Zustand and SHALL NOT use React useState for cross-step form data.
4. THE App SHALL define a separate Zod_Schema for each form step in `/lib/schemas.ts`.
5. THE App SHALL define TypeScript interfaces for the Transaction_Record in `/types/transaction.ts`.
6. THE App SHALL include a `/lib/mongodb.ts` utility with the connection caching pattern and a clearly commented placeholder: `// MONGODB_URI will be provided as environment variable — see .env.local.example`.
7. THE App SHALL ensure `next.config.ts` contains no restrictions that would block the PDF_API_Route on Vercel deployment.
