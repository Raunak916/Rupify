"use client";
import { createTransaction } from "@/actions/transactions";
import { transactionSchema } from "@/app/lib/schema";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AccountType } from "@/generated/prisma";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface SerializedAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDefault: boolean;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  subcategories?: string[];
}

interface AddTransactionFormProps {
  accounts: SerializedAccount[];
  categories: Category[];
}

const AddTransactionForm = ({
  accounts,
  categories,
}: AddTransactionFormProps) => {
  const {
    register,
    watch,
    reset,
    formState: { errors },
    setValue,
    handleSubmit,
    getValues,
    control,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "INCOME",
      amount: "",
      description: "",
      date: new Date(),
      accountId: accounts.find((ac) => ac.isDefault)?.id,
      category: "",
      isRecurring: false,
    },
  });

  const router = useRouter();
  type TransactionFormData = z.infer<typeof transactionSchema>;

  const expense_Categories = categories.filter(
    (item) => item.type === "EXPENSE"
  );

  const income_Categories = categories.filter((item) => item.type === "INCOME");
  const {
    data: newTransaction,
    error,
    loading: createTransactionLoading,
    fn: createTransactionFn,
  } = useFetch(createTransaction);

  useEffect(() => {
    if (newTransaction) {
      toast.success("Transaction created successfully");
      reset();
    }
  }, [newTransaction, createTransactionLoading]);

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  const onsubmit = async (data: TransactionFormData) => {
    await createTransactionFn(data);
  };
  return (
    <div className="w-full">
      {/* AI Recipt Scanner  TODO*/}
      {/* Row 1  */}
      <form
        onSubmit={handleSubmit(onsubmit)}
        className="space-y-6 max-w-3xl mx-auto border rounded-md p-5 shadow hover:shadow-2xl"
      >
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium" htmlFor="type">
            Type
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        {/* Row 2  */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="amount">Amount</label>
            <Input
              type="number"
              step={"0.01"}
              placeholder="₹0.00"
              {...register("amount")}
            />

            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account">
              Account
            </label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div>
                          <span>{account.name}</span>
                          <span>
                            ( ₹
                            {parseFloat(account.balance.toString()).toFixed(2)})
                          </span>
                          {account.isDefault && " (Default)"}
                        </div>
                      </SelectItem>
                    ))}
                    <CreateAccountDrawer>
                      <Button
                        className="w-full select-none items-center text-sm outline-none"
                        variant={"ghost"}
                      >
                        Create Account
                      </Button>
                    </CreateAccountDrawer>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>
        </div>

        {/* Row 3 */}
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium" htmlFor="">
            Category
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {watch("type") === "INCOME"
                    ? income_Categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    : expense_Categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Row 4 */}
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium" htmlFor="date">
            Date
          </label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"}>
                    {field.value ? (
                      format(field.value, "MMM dd, yyyy")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message}</p>
          )}
        </div>

        {/* Row 5 */}
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Input
            type="text"
            placeholder="Enter Description"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Row 6 */}
        <div className="space-y-4">
          <div className="flex justify-between border p-4 rounded-xl">
            <div>
              <div className="font-medium">Recurring Transaction</div>
              <p className="text-sm text-muted-foreground">
                Set up a recurring schedule for this transaction
              </p>
            </div>
            <div className="flex items-center justify-center ">
              <Switch
                className="cursor-pointer"
                checked={watch("isRecurring")}
                onCheckedChange={(checked) => setValue("isRecurring", checked)}
              />
            </div>
          </div>
          {/* if recurring */}
          {watch("isRecurring") && (
            <div className="flex flex-col justify-center border p-4 rounded-xl space-y-1">
              <label htmlFor="isRecurring">Recurring Interval</label>
              <div className="ml-4">
                <Controller
                  name="recurringInterval"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Set Recurring Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.recurringInterval && (
                  <p className="text-sm text-red-500">
                    {errors.recurringInterval.message}
                  </p>
                )}
              </div>
            </div>
          )
          
          }
        </div>

        {/* Row 7  */}
        <div>
          <div className="grid md:grid-cols-2 gap-2">
            <Button
            type="button"
            className="w-full" 
            variant={"outline"}
            onClick={()=>router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransactionLoading}
              className="w-full"
            >
              {createTransactionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating..
                </>
              ) : (
                "Create Transaction"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTransactionForm;
