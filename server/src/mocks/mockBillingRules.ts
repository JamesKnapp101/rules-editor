import type { Rule } from "./mockAdminRules.js";

export const MOCK_BILLING_RULES: Rule[] = [
  {
    id: "BILL-201",
    event: "Make Required",
    target: { field: "Billing Code" },
    when: [{ field: "Charge Type", op: "=", value: "Medical" }],
    action: { kind: "setRequired", required: true },
    summary: "Require Billing Code for Medical charges",
  },
  {
    id: "BILL-202",
    event: "Disable Field",
    target: { field: "Billed Amount" },
    when: [{ field: "Claim Status", op: "=", value: "Submitted" }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Lock Billed Amount once claim is submitted",
  },
  {
    id: "BILL-203",
    event: "Validation",
    target: { field: "Allowed Amount" },
    when: [{ field: "Allowed Amount", op: "exists", value: true }],
    action: {
      kind: "validate",
      validator: "range",
      params: { field: "Allowed Amount", min: 0 },
    },
    summary: "Allowed Amount must be >= 0",
  },
  {
    id: "BILL-204",
    event: "Hide Field",
    target: { field: "Out-of-Network Reason" },
    when: [{ field: "Network Status", op: "=", value: "In Network" }],
    action: { kind: "setVisibility", visible: false },
    summary: "Hide Out-of-Network Reason when In Network",
  },
  {
    id: "BILL-205",
    event: "Make Required",
    target: { field: "Out-of-Network Reason" },
    when: [{ field: "Network Status", op: "=", value: "Out of Network" }],
    action: { kind: "setRequired", required: true },
    summary: "Require Out-of-Network Reason when applicable",
  },
  {
    id: "BILL-206",
    event: "AddOptions",
    target: { field: "Payment Method" },
    when: [{ field: "Payer Type", op: "=", value: "Government" }],
    action: {
      kind: "updateOptions",
      mode: "add",
      options: ["EFT"],
    },
    summary: "Allow EFT for Government payers",
  },
];
