import type { Rule } from "./mockAdminRules.js";

export const MOCK_CLINICAL_RULES: Rule[] = [
  {
    id: "CLIN-301",
    event: "Disable Field",
    target: { field: "Diagnosis Code" },
    when: [{ field: "Encounter Status", op: "=", value: "Closed" }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Lock Diagnosis Code when encounter is closed",
  },
  {
    id: "CLIN-302",
    event: "Make Required",
    target: { field: "Primary Diagnosis" },
    when: [{ field: "Visit Type", op: "=", value: "Clinical" }],
    action: { kind: "setRequired", required: true },
    summary: "Require Primary Diagnosis for clinical visits",
  },
  {
    id: "CLIN-303",
    event: "Hide Field",
    target: { field: "Experimental Notes" },
    when: [{ field: "User Role", op: "!=", value: "Clinician" }],
    action: { kind: "setVisibility", visible: false },
    summary: "Hide Experimental Notes from non-clinicians",
  },
  {
    id: "CLIN-304",
    event: "Validation",
    target: { field: "Symptom Onset Date" },
    when: [{ field: "Visit Date", op: "exists", value: true }],
    action: {
      kind: "validate",
      validator: "dateOrder",
      params: {
        startfield: "Symptom Onset Date",
        endfield: "Visit Date",
      },
    },
    summary: "Symptom onset must be before visit date",
  },
  {
    id: "CLIN-305",
    event: "Disable Field",
    target: { field: "Medication Dosage" },
    when: [{ field: "Allergy Flag", op: "=", value: true }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Disable dosage edits when allergy flag is present",
  },
  {
    id: "CLIN-306",
    event: "Make Required",
    target: { field: "Consent Form Signed" },
    when: [{ field: "Procedure Type", op: "=", value: "Invasive" }],
    action: { kind: "setRequired", required: true },
    summary: "Require consent for invasive procedures",
  },
];
