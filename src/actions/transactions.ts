"use server";

import {
  RecurringInterval,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//ISO string UTC mai convert kar deta hai date ko 
//is liye we use toString()
interface SerializedTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // to string (important!)
  receiptUrl?: string | null;
  description?: string | null;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  nextRecurringDate?: string | null;
  accountId: string;
}

const serializeTransactions = (obj: Transaction) => {
  const serializedTransaction: SerializedTransaction = {
    id: obj.id,
    type: obj.type,
    amount: obj.amount.toNumber(),
    category: obj.category,
    date: obj.date.toString(),
    receiptUrl: obj.receiptUrl,
    description: obj.description,
    status: obj.status,
    isRecurring: obj.isRecurring,
    recurringInterval: obj.recurringInterval
      ? obj.recurringInterval
      : undefined,
    nextRecurringDate: obj.nextRecurringDate
      ? obj.nextRecurringDate?.toString()
      : undefined,
    accountId: obj.accountId,
  };
  return serializedTransaction;
};

type TransactionFormValues = {
  type: "INCOME" | "EXPENSE";
  amount: string;
  description?: string;
  date: Date;
  accountId: string;
  category: string;
  isRecurring: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};

export async function createTransaction(data: TransactionFormValues): Promise<{
  success: boolean;
  data: SerializedTransaction;
}> {
  try {
    const { userId } = await auth();

    if (!userId) throw new Error("Unauthorized");

    //Arcjet to add rate limiting
    //TODO

    //Db check
    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await prisma.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    //according to the transaction type(inside the data prop) the account balance will also change so let's do that too
    const balanceChange = Number(
      data.type === "INCOME" ? data.amount : -data.amount
    );
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          date:new Date(Date.UTC(data.date.getFullYear(), data.date.getMonth(), data.date.getDate())),//becuase ek din pehle ho jaa raha thaa 
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          balance: newBalance,
        },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return {
      success: true,
      data: serializeTransactions(transaction),
    };
  } catch (error) {
    throw error;
  }
}

function calculateNextRecurringDate(
  startDate: Date,
  interval: RecurringInterval
) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;

    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;

    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;

    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      break;
  }

  return date.toString();
}
