"use server";

import {
  RecurringInterval,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma";
import aj from "@/lib/arcjet";
import prisma from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScanProps } from "@/app/(main)/transaction/_components/add-transaction-form";

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

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export type TransactionFormValues = {
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
    //get request data
    const req = await request();
    //check rate limt
    //protect returns <ArcjetDecision> promise
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // how many tokens to consume per request
    });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Rate limit exceeded");
      }
      throw new Error("Request Blocked");
    }

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
          date: new Date(
            Date.UTC(
              data.date.getFullYear(),
              data.date.getMonth(),
              data.date.getDate()
            )
          ), //becuase ek din pehle ho jaa raha thaa
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

function isValidReceipt(data: ScanProps) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.amount === "number" &&
    typeof data.date === "string" &&
    typeof data.description === "string" &&
    typeof data.merchantName === "string" &&
    typeof data.category === "string"
  );
}

export async function scanReceipt(file: File) {
  try {
    const model = genAi.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    //convert to array buffer because they accept bytes as input not file directly
    const arrayBuffer = await file.arrayBuffer();

    //convert arraybuffer to base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: base64String,
        },
      },
      { 
        text: prompt,
      },
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      if (!isValidReceipt(data)) {
        console.error("Invalid receipt data from Gemini:", data);
        throw new Error("Invalid receipt data");
      }
      return {
        amount: data.amount as number,
        date: new Date(data.date as string),
        description: data.description as string,
        category: data.category as string,
        merchantName: data.merchantName as string,
      };
    } catch (parseError) {
      console.error("Error parsing receipt data:", parseError);
      throw new Error("Invalid Response format from Gemini");
    }
  } catch (error) {
    console.error("GEMINI API ERROR:", error);
    throw new Error("Failed to scan receipt");
  }
}
