"use client";
import {
  RecurringInterval,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCw,
  SearchIcon,
  Trash,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

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

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const TransactionTable = ({
  transactions,
}: {
  transactions: SerializedTransaction[];
}) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringfFilter, setRecurringFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;
  const {
    data: deleted,
    loading: deleteLoading,
    fn: deleteFn,
  } = useFetch(bulkDeleteTransactions);

  const filteredAndSortedTransactions = useMemo(() => {
    //During render, compute this value
    // only if dependencies changed
    //if nothing changed return the preious cached value
    let result = [...transactions]; //creating a copy so that original doesnt change

    //apply search filter
    //filter takes a call-back which returns a boolean
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((tx) =>
        tx.description?.toLowerCase().includes(searchLower)
      );
    }

    //apply recurring filter
    if (recurringfFilter) {
      result = result.filter((tx) => {
        if (recurringfFilter === "recurring") return tx.isRecurring;
        return tx.isRecurring === false;
      });
    }

    //apply type filter
    if (typeFilter) {
      result = result.filter((tx) => {
        if (typeFilter === "Income") {
          return tx.type === "INCOME";
        }
        return tx.type === "EXPENSE";
      });
    }

    //Apply sorting
    result.sort((a, b) => {
      let comparision = 0;
      switch (sortConfig.field) {
        case "date":
          comparision = +new Date(a.date) - +new Date(b.date);
          //+new Date() converts to number as Date - Date is not possible
          break;

        case "amount":
          comparision = a.amount - b.amount;
          break;

        case "category":
          comparision = a.category.localeCompare(b.category);
          break;

        default:
          comparision = 0;
      }

      return sortConfig.direction === "asc" ? comparision : -comparision;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringfFilter, sortConfig]);

  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  ); // agar 19 hai toh 2 pages not 1 ( isiliye ceil )

  const paginatedTransaction = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [currentPage, filteredAndSortedTransactions]);

  const handleSort = (field: string) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  //pehla click mai ascending rahega, firse click karoge toh descending ho jayega

  const handleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item != id)
        : [...current, id]
    );
  };
  //if id exists remove it , else add it
  //   console.log(selectedIds)

  const handleSelectAll = () => {
    setSelectedIds(
      (current) =>
        current.length === paginatedTransaction.length //matlab pehle se sara selected hai toh sara haata do
          ? []
          : paginatedTransaction.map((t) => t.id) //yaa toh sara lelo
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm("Are you sure you want to delete these transactions?")) {
      await deleteFn(selectedIds);
      setSelectedIds([]);
    } else return;
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.error("Transactions deleted successfully");
    }
  }, [deleteLoading, deleted]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setSelectedIds([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]); // Clear selections on page change
  };

  return (
    <div className="space-y-4">
      {!!deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(Value) => setTypeFilter(Value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Expense">Expense</SelectItem>
              <SelectItem value="Income">Income</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringfFilter}
            onValueChange={(Value) => setRecurringFilter(Value)}
          >
            <SelectTrigger className="w-[155px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only </SelectItem>
              <SelectItem value="non-recurring">Non Recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk Actions for deleting */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant={"destructive"} onClick={handleBulkDelete}>
                <Trash />
                <span className="font-bold">
                  Delete Selected ({selectedIds.length})
                </span>
              </Button>
            </div>
          )}

          {/* to display X after any filter is applied */}
          {(searchTerm || typeFilter || recurringfFilter) && (
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={handleClearFilters}
            >
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length ===
                      paginatedTransaction.length &&
                    paginatedTransaction.length > 0
                  }
                />
              </TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center ">
                  Date{" "}
                  {sortConfig.field === "date" &&
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>

              <TableHead className="">Description</TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category
                  {sortConfig.field === "category" &&
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>

              <TableHead className="cursor-pointer">
                <div
                  className="flex items-center justify-center"
                  onClick={() => handleSort("amount")}
                >
                  Amount
                  {sortConfig.field === "amount" &&
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>

              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransaction.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransaction.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                    />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>

                  {/* Description */}
                  <TableCell>{transaction.description}</TableCell>

                  {/* Category */}
                  <TableCell className="capitalize">
                    <span
                      style={{
                        backgroundColor: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>

                  {/* Amount */}
                  <TableCell
                    className="text-right md:text-center font-medium"
                    style={{
                      color: transaction.type === "EXPENSE" ? "red" : "green",
                    }}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}₹
                    {transaction.amount.toFixed(2)}
                  </TableCell>

                  {/* Recurring */}
                  <TableCell>
                    {transaction.isRecurring ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant={"outline"}
                            className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                          >
                            <RefreshCw className="h-3 w-3" />
                            {transaction.recurringInterval
                              ? RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              : "Recurring"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">Next Date:</div>
                            <p>
                              {transaction.nextRecurringDate
                                ? format(
                                    new Date(transaction.nextRecurringDate),
                                    "PP"
                                  )
                                : "No date specified"}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant={"outline"} className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant={"ghost"} className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
                          className="font-bold"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive font-bold"
                          onClick={handleBulkDelete}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
