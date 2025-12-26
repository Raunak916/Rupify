import { date, z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

//it will be used in form and remember form always returns string except this is default nd type

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is Required"),
    description: z.string().optional(),
    date: z.date().refine((val) => val !== undefined, {
      message: "Date is required",
    }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if(data.isRecurring && !data.recurringInterval){
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required",
        path: ["recurringInterval"],
      })
    }
  });
