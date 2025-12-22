"use client";
import {
  RecurringInterval,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma";
import { log } from "console";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
interface SerializedTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string (important!)
  receiptUrl?: string | null;
  description?: string | null;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval | null;
  nextRecurringDate?: string | null;
}

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last 1 Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

const AccountChart = ({
  transactions,
}: {
  transactions: SerializedTransaction[];
}) => {
  const [dateRange, setDateRange] = useState<keyof typeof DATE_RANGES>("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date(); // current date

    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0)); //Jan 1, 1970, 00:00:00 UTC

    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const grouped = filtered.reduce(
      (
        acc: Record<string, { date: string; income: number; expense: number }>,
        transaction
      ) => {
        const date = format(new Date(transaction.date), "MMM dd");
        if (!acc[date]) {
          acc[date] = { date, income: 0, expense: 0 };
        }

        if (transaction.type === "INCOME") {
          acc[date].income += transaction.amount;
        } else {
          acc[date].expense += transaction.amount;
        }
        return acc;
      },
      {}
    );

    // convert to array and sort by date 
    return Object.values(grouped).sort((a ,b)=>
      +new Date(a.date) - +new Date(b.date)
    )
  }, [transactions, dateRange]);

  // console.log(filteredData);
  // { "date": "Nov 22", "income": 2906.4700000000003, "expense": 140.47 }

  const totals = useMemo(()=>{
    return filteredData.reduce((acc,day)=>(
      {
        income: acc.income + day.income,
        expense: acc.expense + day.expense
      }
    ),{income:0,expense:0})
  },[filteredData])

  return (
    <div>
      {/* <BarChart
        style={{
          width: "100%",
          maxWidth: "700px",
          maxHeight: "70vh",
          aspectRatio: 1.618,
        }}
        responsive
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="pv"
          fill="#8884d8"
          activeBar={{ fill: "pink", stroke: "blue" }}
          radius={[10, 10, 0, 0]}
        />
        <Bar
          dataKey="uv"
          fill="#82ca9d"
          activeBar={{ fill: "gold", stroke: "purple" }}
          radius={[10, 10, 0, 0]}
        />
      </BarChart> */}
    </div>
  );
};

export default AccountChart;
