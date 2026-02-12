import z from "zod";

export const RuleEventSchema = z.union([
  z.literal("Hide Field"),
  z.literal("Disable Field"),
  z.literal("Make Required"),
  z.literal("Validation"),
  z.literal("AddOptions"),
  z.literal("RemoveOptions"),
]);

const PredEqSchema = z.object({
  field: z.string(),
  op: z.union([
    z.literal("="),
    z.literal("!="),
    z.literal("<"),
    z.literal("<="),
    z.literal(">"),
    z.literal(">="),
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const PredInSchema = z.object({
  field: z.string(),
  op: z.union([z.literal("in"), z.literal("notIn")]),
  value: z.array(z.union([z.string(), z.number()])),
});

const PredExistsSchema = z.object({
  field: z.string(),
  op: z.literal("exists"),
  value: z.boolean(),
});

const PredBetweenSchema = z.object({
  field: z.string(),
  op: z.literal("between"),
  value: z.tuple([z.number(), z.number()]),
});

export const PredicateSchema = z.union([
  PredEqSchema,
  PredInSchema,
  PredExistsSchema,
  PredBetweenSchema,
]);

/** Action */
const ActionSetVisibilitySchema = z.object({
  kind: z.literal("setVisibility"),
  visible: z.boolean(),
});

const ActionSetEnabledSchema = z.object({
  kind: z.literal("setEnabled"),
  enabled: z.boolean(),
});

const ActionSetRequiredSchema = z.object({
  kind: z.literal("setRequired"),
  required: z.boolean(),
});

const ActionValidateSchema = z.object({
  kind: z.literal("validate"),
  validator: z.union([
    z.literal("dateOrder"),
    z.literal("range"),
    z.literal("requiredIf"),
  ]),
  params: z.record(z.string(), z.unknown()),
});

const ActionUpdateOptionsSchema = z.object({
  kind: z.literal("updateOptions"),
  mode: z.union([z.literal("add"), z.literal("remove")]),
  options: z.array(z.string()),
});

export const RuleActionSchema = z.discriminatedUnion("kind", [
  ActionSetVisibilitySchema,
  ActionSetEnabledSchema,
  ActionSetRequiredSchema,
  ActionValidateSchema,
  ActionUpdateOptionsSchema,
]);

/** Rule */
export const RuleSchema = z.object({
  id: z.string(),
  event: RuleEventSchema,
  target: z.object({ field: z.string() }),
  when: z.array(PredicateSchema),
  action: RuleActionSchema,
  summary: z.string().optional(),
});

export type Rule = z.infer<typeof RuleSchema>;
