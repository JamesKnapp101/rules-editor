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
        params: Record<string, unknown>;
      }
    | { kind: "updateOptions"; mode: "add" | "remove"; options: string[] };
  summary?: string;
};

type RuleEvent =
  | "Hide Field"
  | "Disable Field"
  | "Make Required"
  | "Validation"
  | "AddOptions"
  | "RemoveOptions";

type Predicate =
  | {
      field: string;
      op: "=" | "!=" | "<" | "<=" | ">" | ">=";
      value: string | number | boolean;
    }
  | { field: string; op: "in" | "notIn"; value: Array<string | number> }
  | { field: string; op: "exists"; value: boolean }
  | { field: string; op: "between"; value: [number, number] };
