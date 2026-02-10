type RuleEvent =
  | "Hide Field"
  | "Disable Field"
  | "Make Required"
  | "Validation"
  | "AddOptions"
  | "RemoveOptions";

type Operator =
  | "="
  | "!="
  | "in"
  | "notIn"
  | "exists"
  | "between"
  | "<"
  | "<="
  | ">"
  | ">=";

type Predicate =
  | {
      field: string;
      op: "=" | "!=" | "<" | "<=" | ">" | ">=";
      value: string | number | boolean;
    }
  | { field: string; op: "in" | "notIn"; value: Array<string | number> }
  | { field: string; op: "exists"; value: boolean }
  | { field: string; op: "between"; value: [number, number] };

export type Rule = {
  id: string;
  event: RuleEvent;
  target: { field: string };
  when: Predicate[];
  action:
    | { kind: "setVisibility"; visible: boolean }
    | { kind: "setEnabled"; enabled: boolean }
    | { kind: "setRequired"; required: boolean }
    | {
        kind: "validate";
        validator: "dateOrder" | "range" | "requiredIf";
        params: Record<string, any>;
      }
    | { kind: "updateOptions"; mode: "add" | "remove"; options: string[] };
  summary?: string; // optional UI helper
};

export const MOCK_RULES: Rule[] = [
  {
    id: "RULE-101",
    event: "Hide Field",
    target: { field: "Business Reason" },
    when: [{ field: "Role", op: "!=", value: "Admin" }],
    action: { kind: "setVisibility", visible: false },
    summary: "Hide Business Reason when Role != Admin",
  },
  {
    id: "RULE-102",
    event: "Disable Field",
    target: { field: "Effective Date" },
    when: [{ field: "Status", op: "=", value: "Approved" }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Disable Effective Date when Status = Approved",
  },
  {
    id: "RULE-103",
    event: "Make Required",
    target: { field: "End Date" },
    when: [{ field: "Contract Type", op: "=", value: "Temporary" }],
    action: { kind: "setRequired", required: true },
    summary: "Require End Date when Contract Type = Temporary",
  },
  {
    id: "RULE-104",
    event: "Validation",
    target: { field: "Start Date" },
    when: [{ field: "End Date", op: "exists", value: true }],
    action: {
      kind: "validate",
      validator: "dateOrder",
      params: { startfield: "Start Date", endfield: "End Date" },
    },
    summary: "Validate Start Date < End Date",
  },
  {
    id: "RULE-105",
    event: "AddOptions",
    target: { field: "Coverage Level" },
    when: [{ field: "Region", op: "=", value: "US" }],
    action: {
      kind: "updateOptions",
      mode: "add",
      options: ["Gold", "Platinum"],
    },
    summary: "Add Gold/Platinum to Coverage Level when Region = US",
  },
  {
    id: "RULE-106",
    event: "RemoveOptions",
    target: { field: "Coverage Level" },
    when: [{ field: "Region", op: "!=", value: "US" }],
    action: { kind: "updateOptions", mode: "remove", options: ["Platinum"] },
    summary: "Remove Platinum from Coverage Level when Region != US",
  },
  {
    id: "RULE-107",
    event: "Hide Field",
    target: { field: "Internal Notes" },
    when: [{ field: "Role", op: "=", value: "External User" }],
    action: { kind: "setVisibility", visible: false },
    summary: "Hide Internal Notes for External User",
  },
  {
    id: "RULE-108",
    event: "Disable Field",
    target: { field: "Employee ID" },
    when: [{ field: "Record Source", op: "=", value: "Payroll Import" }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Disable Employee ID for Payroll Import",
  },
  {
    id: "RULE-109",
    event: "Make Required",
    target: { field: "Business Unit" },
    when: [{ field: "Department", op: "exists", value: true }],
    action: { kind: "setRequired", required: true },
    summary: "Require Business Unit when Department exists",
  },
  {
    id: "RULE-110",
    event: "Validation",
    target: { field: "Discount Percentage" },
    when: [{ field: "Discount Percentage", op: "exists", value: true }],
    action: {
      kind: "validate",
      validator: "range",
      params: { field: "Discount Percentage", min: 0, max: 100 },
    },
    summary: "Validate Discount Percentage is 0–100",
  },
  {
    id: "RULE-111",
    event: "AddOptions",
    target: { field: "Payment Frequency" },
    when: [{ field: "Employee Type", op: "=", value: "Hourly" }],
    action: { kind: "updateOptions", mode: "add", options: ["Bi-Weekly"] },
    summary: "Add Bi-Weekly when Employee Type = Hourly",
  },
  {
    id: "RULE-112",
    event: "RemoveOptions",
    target: { field: "Payment Frequency" },
    when: [{ field: "Employee Type", op: "=", value: "Salaried" }],
    action: { kind: "updateOptions", mode: "remove", options: ["Weekly"] },
    summary: "Remove Weekly when Employee Type = Salaried",
  },
  {
    id: "RULE-113",
    event: "Hide Field",
    target: { field: "Termination Reason" },
    when: [{ field: "Employment Status", op: "!=", value: "Terminated" }],
    action: { kind: "setVisibility", visible: false },
    summary: "Hide Termination Reason unless Terminated",
  },
  {
    id: "RULE-114",
    event: "Disable Field",
    target: { field: "Salary Amount" },
    when: [{ field: "Role", op: "=", value: "Viewer" }],
    action: { kind: "setEnabled", enabled: false },
    summary: "Disable Salary Amount for Viewer",
  },
  {
    id: "RULE-115",
    event: "Validation",
    target: { field: "Rejection Comment" },
    when: [{ field: "Status", op: "=", value: "Rejected" }],
    action: {
      kind: "validate",
      validator: "requiredIf",
      params: {
        requiredfield: "Rejection Comment",
        whenfield: "Status",
        equals: "Rejected",
      },
    },
    summary: "Require Rejection Comment when Status = Rejected",
  },
];
