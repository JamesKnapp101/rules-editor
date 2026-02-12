import { z } from "zod";
import { RuleSchema } from "./ruleSchemas";

const UserSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
});

export const RuleEditorServerToClientSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("WELCOME"), connectionId: z.string() }),

  z.object({
    type: z.literal("PRESENCE_SNAPSHOT"),
    users: z.array(UserSchema),
  }),

  z.object({
    type: z.literal("USER_JOINED"),
    user: UserSchema,
  }),

  z.object({
    type: z.literal("USER_LEFT"),
    userId: z.string(),
  }),

  z.object({
    type: z.literal("EDIT_STARTED"),
    ruleId: z.string(),
    userId: z.string(),
    displayName: z.string(),
  }),

  z.object({
    type: z.literal("EDIT_CANCELLED"),
    ruleId: z.string(),
    userId: z.string(),
    displayName: z.string(),
  }),

  z.object({
    type: z.literal("RULE_SAVED"),
    ruleId: z.string(),
    userId: z.string(),
    displayName: z.string(),
  }),

  z.object({
    type: z.literal("ERROR"),
    message: z.string(),
  }),

  z.object({
    type: z.literal("ROOM_COUNTS"),
    counts: z.record(z.string(), z.number()),
  }),

  z.object({
    type: z.literal("RULES_SNAPSHOT"),
    room: z.string(),
    rules: z.array(RuleSchema),
  }),
]);

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
