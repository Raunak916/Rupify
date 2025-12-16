import { seedTransactions } from "@/actions/seed"

export async function GET(){
    const result = await seedTransactions()

    return Response.json(result)
}

// for seeding dummy data into transactions Table 