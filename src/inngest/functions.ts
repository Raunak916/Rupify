import prisma from "@/lib/prisma";
import { inngest } from "./client";
import { log } from "console";
import { sendEmail } from "@/actions/send-email";
import { EmailTemplate } from "../../emails/template";

// You MUST export the function for it to be recognized as a module
export const checkBudgetAlert = inngest.createFunction(
  { id: "Check Budget alerts" },
  {cron: "0 */6 * * * " },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget", async () => {
      return await prisma.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    //go through the datas and see if the expenses exceeds the budget amount
    //then we will send the mail

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0]; //as there can be only one default account per user

      if (!defaultAccount) continue; //no default account then skip

      //agar default account hai toh
      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1);

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const expenses = await prisma.transaction.aggregate({
          where: {
            userId: budget.user.id,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = Number(budget.amount);
        const percentageUsed = (totalExpenses / budgetAmount) * 100;
        log("percentageUsed", percentageUsed);
        //send email if more than 75% used
        if (
          percentageUsed >= 75 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          //Send email(using react Email package)
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react:EmailTemplate({
              username: budget.user.name ?? undefined,
              type: "budget-alert",
              data: {
                budgetAmount,
                totalExpenses,
                percentageUsed,
                accountName: defaultAccount.name,
              },
            })
          })
          //update last alert sent
          await prisma.budget.update({
            where: {
              id: budget.id,
            },
            data: {
              lastAlertSent: new Date(),
            },
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate: Date, currentDate: Date) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}
