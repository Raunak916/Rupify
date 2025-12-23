"use client";
import React, { use, useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { tuple } from "zod";
import useFetch from "@/hooks/use-fetch";
import { updateBudget } from "@/actions/budget";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
interface BudgetProgressProps {
  initialBudget: {
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: number;
    lastAlertSent: Date | null;
  } | null;
  currentExpenses: number;
}

const BudgetProgress = ({
  initialBudget,
  currentExpenses,
}: BudgetProgressProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const {
    data: updatedBudget,
    fn: updateBudgetFn,
    loading: updateBudgetLoading,
    error,
  } = useFetch(updateBudget);

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  useEffect(() => {
    if (updatedBudget && !updateBudgetLoading) {
      toast.success("Budget updated successfully");
      setIsEditing(false);
    }
  }, [updatedBudget, updateBudgetLoading]);

  const hadnleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };
  return (
    <div className="space-y-4">
      <Card className="hover:shadow-md">
        <CardHeader className="flex flex=row items-center justify-between space-y-0 pb-2">
          <div className="flex-1">
            <CardTitle>Monthly Budget (Default Account) </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-32"
                    placeholder="Enter amount"
                    autoFocus
                    disabled={updateBudgetLoading}
                  />
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={handleUpdateBudget}
                    className="text-green-500"
                    disabled={updateBudgetLoading}
                  >
                    <Check />
                  </Button>
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={hadnleCancel}
                    className="text-red-500"
                    disabled={updateBudgetLoading}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <>
                  <CardDescription>
                    {initialBudget
                      ? `₹${currentExpenses.toFixed(
                          2
                        )} of ₹${initialBudget.amount.toFixed(2)} spent`
                      : "Set a budget"}
                  </CardDescription>
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {initialBudget && (
            <div className="space-y-2">
              <Progress value={percentUsed} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetProgress;
