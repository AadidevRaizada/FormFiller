# Implementation Plan: ASEAN Document Generator

## Overview

This plan implements a greenfield Next.js 14 mobile-first web application for ASEAN International DMCC. The app provides a 4-step form wizard to generate Bunker Nomination and Order Confirmation PDFs, Excel exports, and persists transactions to MongoDB Atlas. Implementation proceeds bottom-up: project scaffolding → types/schemas → state management → shell/layout → form wizard steps → PDF generation → Excel export → API routes → history page → responsive polish.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize Next.js 14 project with App Router and install all dependencies
    - Run `npx create-next-app@14` with TypeScript, Tailwind CSS, ESLint, App Router options
    - Install runtime dependencies: `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@react-pdf/renderer`, `xlsx`, `mongodb`, `next-themes`, `react-icons`
    - Install shadcn/ui CLI and initialize with default config
    - Add shadcn components: `button`, `card`, `input`, `textarea`, `select`, `form`, `label`, `toast`, `toaster`
    - Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `fast-check`
    - _Requirements: 17.1, 17.7_

  - [x] 1.2 Configure project structure, environment, and build settings
    - Create directory structure: `/components/form/`, `/components/pdf/`, `/lib/`, `/types/`, `/__tests__/unit/`, `/__tests__/components/`, `/__tests__/integration/`, `/__tests__/properties/`
    - Create `.env.local.example` with `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/asean_dmcc?retryWrites=true&w=majority`
    - Configure `vitest.config.ts` with jsdom environment, path aliases, and setup file
    - Verify `next.config.ts` has no restrictions that would block the PDF API route on Vercel
    - _Requirements: 17.1, 17.2, 17.7_

- [x] 2. TypeScript types and Zod validation schemas
  - [x] 2.1 Define TypeScript interfaces and Zod schemas
    - Create `/types/transaction.ts` with `TransactionRecord` interface (all form fields + `_id?` + `createdAt`)
    - Create `/lib/schemas.ts` with `step1Schema`, `step2Schema`, `step3Schema` Zod objects
    - Step 1: all fields required except `signatory` (optional, defaults to "Sahir Jamal")
    - Step 2: `bn_to`, `bn_attn`, `bn_sellers`, `bn_buyingPrice` required; `bn_suppliers`, `bn_paymentTerms`, `bn_remarks` optional
    - Step 3: `oc_to`, `oc_attn`, `oc_buyers`, `oc_sellingPrice` required; `oc_paymentTerms`, `oc_remarks` optional
    - Export inferred types from each schema for use in React Hook Form
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 17.4, 17.5_

  - [ ]* 2.2 Write unit tests for Zod schemas
    - Test all required field validations for each step schema
    - Test optional fields pass when empty
    - Test signatory defaults to "Sahir Jamal" when empty
    - _Requirements: 2.2, 2.3, 3.2, 3.3, 4.2, 4.3_

- [x] 3. Zustand store with persist middleware
  - [x] 3.1 Implement the form store
    - Create `/lib/store.ts` with Zustand store matching the `FormState` interface from design
    - Include `setField`, `setAllFields`, and `resetForm` actions
    - Configure persist middleware with localStorage backend and a storage key
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 17.3_

  - [ ]* 3.2 Write property test for form data localStorage round-trip
    - **Property 1: Form data localStorage round-trip**
    - Generate random form data with fast-check, persist to store, rehydrate from localStorage, verify field equality
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 3.3 Write property test for back navigation preserving form data
    - **Property 3: Back navigation preserves form data**
    - Generate random form data, simulate setting fields across steps, verify all values remain intact after reading back
    - **Validates: Requirements 7.2**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Application shell, layout, and theming
  - [x] 5.1 Implement root layout with next-themes and shadcn Toaster
    - Create `/app/layout.tsx` with `ThemeProvider` from next-themes (attribute="class", defaultTheme="system", enableSystem)
    - Add shadcn `Toaster` component to layout
    - Configure brand color CSS variables in `globals.css`: primary (#1d4ed8), brand teal (#0e7490), dark background (#0b1120), card dark (#111c30), border dark (#1e3a5f)
    - Set up dark/light mode CSS variable overrides for shadcn theming
    - _Requirements: 14.1, 14.2, 14.5, 14.6, 16.3_

  - [x] 5.2 Implement TopNav with brand text, navigation links, and ThemeToggle
    - Create `/components/TopNav.tsx` with "ASEAN" brand text in teal, "Document Generator" app name, nav links to `/form` and `/history`
    - Create `/components/ThemeToggle.tsx` using `useTheme()` from next-themes, FiSun icon in dark mode, FiMoon icon in light mode
    - Render TopNav in root layout above page content
    - _Requirements: 14.3, 14.4, 16.1, 16.2_

  - [x] 5.3 Implement root page redirect
    - Create `/app/page.tsx` that redirects to `/form` using Next.js `redirect()` function
    - _Requirements: 1.4_

- [x] 6. Form wizard shell and step navigation
  - [x] 6.1 Implement FormShell with step progress indicator and sticky action bar
    - Create `/components/form/FormShell.tsx` managing `currentStep` state (1-4)
    - Implement `StepProgressIndicator`: 4 numbered steps with connecting line, active step in brand blue (#1d4ed8), checkmark on completed steps
    - Condense step indicator layout on viewports below 768px
    - Implement `StickyActionBar` fixed at bottom: Back button (steps 2-4), Next button (steps 1-3), export buttons (step 4 only)
    - Back button hidden on step 1; Next button hidden on step 4
    - All buttons full-width below 768px with min-height 48px
    - Render step content inside shadcn Card with CardHeader (title + description) and CardContent
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5, 15.3, 15.4, 15.5_

  - [x] 6.2 Wire step validation and navigation logic
    - On "Next" tap: validate current step fields against corresponding Zod schema
    - On validation failure: scroll to first invalid field, highlight with red border, show FormMessage error, remain on current step
    - On validation success: advance to next step
    - On "Back" tap: return to previous step with all data intact in Zustand store
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.3 Write property test for validation gating step advancement
    - **Property 2: Validation gates step advancement**
    - Generate random valid/invalid form data with fast-check, verify step advances iff Zod schema validates
    - **Validates: Requirements 6.1, 6.4, 6.5**

- [x] 7. Form step components (Steps 1-3)
  - [x] 7.1 Implement Step1TransactionDetails component
    - Create `/components/form/Step1TransactionDetails.tsx`
    - Render fields in order: Date, Vessel Name & IMO, Port, ETA, Product, Quantity, Delivery Mode, Agents, Physical Supplier, Signatory
    - Use React Hook Form with Zod resolver for step1Schema
    - Initialize form values from Zustand store; sync changes back to store on field change
    - Use shadcn FormField, FormItem, FormLabel, FormControl, FormMessage wrappers
    - All inputs min 48px tap target height, 16px font-size to prevent iOS auto-zoom
    - Call `onValid()` callback when validation passes on Next
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 15.1, 15.2_

  - [x] 7.2 Implement Step2BunkerNomination component
    - Create `/components/form/Step2BunkerNomination.tsx`
    - Render fields in order: To, Attn, Sellers, Suppliers, Buying Price, Supplier Payment Terms, Supplier Remarks
    - Use React Hook Form with Zod resolver for step2Schema
    - Initialize from Zustand store; sync changes back on field change
    - Same shadcn form wrappers and mobile-first sizing as Step 1
    - _Requirements: 3.1, 3.2, 3.3, 15.1, 15.2_

  - [x] 7.3 Implement Step3OrderConfirmation component
    - Create `/components/form/Step3OrderConfirmation.tsx`
    - Render fields in order: To, Attn, Buyers, Selling Price, Buyer Payment Terms, Buyer Remarks
    - Use React Hook Form with Zod resolver for step3Schema
    - Initialize from Zustand store; sync changes back on field change
    - Same shadcn form wrappers and mobile-first sizing as Step 1
    - _Requirements: 4.1, 4.2, 4.3, 15.1, 15.2_

- [x] 8. Step 4 — Review and Export
  - [x] 8.1 Implement Step4ReviewExport component
    - Create `/components/form/Step4ReviewExport.tsx`
    - Read all form data from Zustand store (read-only)
    - Render two shadcn Card components: "Bunker Nomination Summary" and "Order Confirmation Summary"
    - Display each field as label/value row in the appropriate card
    - Cards side-by-side at ≥768px, stacked vertically below 768px
    - Render 4 action buttons: Save Transaction (primary, FiSave), Download BN PDF (purple, FiFileText), Download OC PDF (blue, FiFile), Download Excel (green, FiGrid)
    - Buttons in horizontal row at ≥768px, stacked full-width below 768px
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 8.2 Write property test for review summary completeness
    - **Property 4: Review summary completeness**
    - Generate random valid complete form data, render Step4ReviewExport, verify every field value appears in the appropriate summary card
    - **Validates: Requirements 5.4**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. PDF document components
  - [x] 10.1 Implement BunkerNominationDocument PDF component
    - Create `/components/pdf/BunkerNominationDocument.tsx` using `@react-pdf/renderer` (Document, Page, View, Text, StyleSheet)
    - Page 1: ASEAN header (logo left, company address right with "EMAIL: bunkers@asean.ae"), centered "Bunker Nomination" title, To/Attn/Date fields, bold tagline, Vessel with colon, sub-lines, "ASEAN INTERNATIONAL DMCC", Port, ETA, Product, Quantity, Price, Delivery mode, Sellers (from input), Buyers ("Asean International DMCC" hardcoded), Suppliers (from input), Agents, Payment, Remarks (default "-"), "Kind regards", signatory
    - Page 2: Same header, bold underlined "NOTES" section with operations contact details, bold underlined "REMARKS" section with BIMCO 2018 terms, italic centered footer with border-top and asterisk
    - Reproduce all boilerplate text exactly as specified
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [x] 10.2 Implement OrderConfirmationDocument PDF component
    - Create `/components/pdf/OrderConfirmationDocument.tsx` using `@react-pdf/renderer`
    - Page 1: ASEAN header (address with "bunkers@asean.ae" without "EMAIL:" prefix), centered "ORDER CONFIRMATION" title, To/Attn/Date, bold tagline with "nomination" wording, Vessel without colon, sub-lines with buyer company name, Port, ETA, Product, Quantity, Price, Delivery Mode, Sellers ("Asean International DMCC" hardcoded), Buyers (from input), Supplier (singular label, from physical_supplier), Agents, Remarks (with colon), Payment, "Kind regards", signatory
    - Page 2: Same header, "NOTES" section with operations contact and confirmation request, "REMARKS" section with six italic remark lines, italic centered footer without asterisk
    - Reproduce all boilerplate text exactly as specified
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [ ]* 10.3 Write property test for BN document field completeness
    - **Property 5: Bunker Nomination document field completeness**
    - Generate random valid form data, render BN component, verify all dynamic field values and "Asean International DMCC" hardcoded buyer appear
    - **Validates: Requirements 9.3**

  - [ ]* 10.4 Write property test for OC document field completeness
    - **Property 6: Order Confirmation document field completeness**
    - Generate random valid form data, render OC component, verify all dynamic field values and "Asean International DMCC" hardcoded seller appear
    - **Validates: Requirements 10.3**

- [x] 11. PDF API route
  - [x] 11.1 Implement /api/generate-pdf POST route
    - Create `/app/api/generate-pdf/route.ts`
    - Accept POST body `{type: 'bn' | 'oc', data: FormData}`
    - Render the appropriate PDF component server-side using `@react-pdf/renderer`'s `renderToBuffer`
    - Return PDF blob with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="BunkerNomination_<vessel>.pdf"` or `"OrderConfirmation_<vessel>.pdf"`
    - Wrap in try/catch; on failure return 500 with `{ error: "Failed to generate PDF" }`
    - _Requirements: 9.1, 9.2, 10.1, 10.2_

- [ ] 12. Excel export module
  - [x] 12.1 Implement client-side Excel export
    - Create `/lib/excel.ts` with `generateExcel(data)` function
    - Use `xlsx` package to create workbook with two sheets: "Bunker Nomination" and "Order Confirmation"
    - Each sheet contains label/value rows for all fields relevant to that document type
    - Trigger browser download with filename `ASEAN_<VesselFirstWord>_<PortFirstWord>_<Date>.xlsx`
    - Wrap in try/catch; on failure show error toast
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 12.2 Write property test for Excel export field completeness
    - **Property 7: Excel export field completeness**
    - Generate random valid form data, generate workbook, verify two sheets exist and each contains all relevant field values
    - **Validates: Requirements 11.3, 11.4**

- [x] 13. Wire Step 4 export actions
  - [x] 13.1 Connect Step4ReviewExport buttons to PDF API, Excel export, and transaction save
    - "Download BN PDF" button: POST to `/api/generate-pdf` with `{type:'bn', data}`, trigger download of returned blob
    - "Download OC PDF" button: POST to `/api/generate-pdf` with `{type:'oc', data}`, trigger download of returned blob
    - "Download Excel" button: call `generateExcel(data)` from lib/excel.ts
    - "Save Transaction" button: POST to `/api/transactions` with form data, show success/error toast
    - Show loading spinners/disabled state during API calls
    - On successful save, optionally reset form via `resetForm()` action
    - _Requirements: 9.1, 10.1, 11.1, 12.1, 12.3_

- [x] 14. MongoDB connection utility and transactions API route
  - [x] 14.1 Implement MongoDB connection utility
    - Create `/lib/mongodb.ts` with `global._mongoClientPromise` caching pattern
    - Handle missing `MONGODB_URI` gracefully (warn and enable mock mode)
    - Include comment: `// MONGODB_URI will be provided as environment variable — see .env.local.example`
    - No hardcoded credentials
    - _Requirements: 12.5, 12.6, 17.6_

  - [x] 14.2 Implement /api/transactions GET and POST route
    - Create `/app/api/transactions/route.ts`
    - POST handler: insert `TransactionRecord` with `createdAt: new Date()` into `transactions` collection; return `{ success: true, id }` on success
    - GET handler: find all transactions sorted by `createdAt` desc; return JSON array
    - Mock mode: if `MONGODB_URI` not set, POST logs to console and returns `{ success: true, mock: true }`; GET returns empty array
    - Wrap both handlers in try/catch; return 500 with error message on failure
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 13.1, 13.6_

- [x] 15. Transaction history page
  - [x] 15.1 Implement /history page with transaction list and re-export
    - Create `/app/history/page.tsx`
    - Fetch transactions from `/api/transactions` GET on page load
    - Display transactions in a list sorted by most recent first
    - Show for each transaction: Vessel name, Port, Date, Buyer company (from `oc_to`), Supplier company (from `bn_to`)
    - Display "Re-export" button on each transaction row
    - On "Re-export" tap: populate Zustand store with transaction data via `setAllFields()`, navigate to `/form` at Step 4
    - Handle loading state and error state with retry option
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 15.2 Write property test for transaction history sort order
    - **Property 8: Transaction history sort order**
    - Generate random transaction records with distinct `createdAt` timestamps, verify display in strictly descending order
    - **Validates: Requirements 13.2**

  - [ ]* 15.3 Write property test for history displaying required fields
    - **Property 9: History displays required fields**
    - Generate random transaction records, verify vessel name, port, date, buyer company, and supplier company are displayed
    - **Validates: Requirements 13.3**

  - [ ]* 15.4 Write property test for re-export populating store correctly
    - **Property 10: Re-export populates store correctly**
    - Generate random transaction record, trigger re-export via `setAllFields()`, verify Zustand store matches original data
    - **Validates: Requirements 13.5**

- [x] 16. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Mobile-first responsive polish and final integration
  - [x] 17.1 Verify and refine mobile-first responsive design across all pages
    - Verify all layouts work at 375px minimum width without horizontal scrolling
    - Verify all input fields have min 48px tap target height and 16px font-size
    - Verify all buttons are full-width below 768px with min 48px height
    - Verify Step4 summary cards and action buttons switch between stacked/side-by-side at 768px breakpoint
    - Verify StepProgressIndicator condenses on mobile
    - Verify StickyActionBar remains fixed at bottom on all screen sizes
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major milestones
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The app runs in mock mode (no database) when MONGODB_URI is not set, enabling local development without MongoDB
