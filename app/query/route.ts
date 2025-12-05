import postgres from 'postgres';

// Initialize sql connection only if POSTGRES_URL is set
let sql: ReturnType<typeof postgres> | null = null;

if (process.env.POSTGRES_URL) {
  sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });
}

async function listInvoices() {
  if (!sql) throw new Error('Database connection not initialized');
  const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;
  return data;
}

export async function GET() {
  try {
    // Check if POSTGRES_URL is set
    if (!process.env.POSTGRES_URL || !sql) {
      return Response.json(
        {
          error: {
            message:
              'POSTGRES_URL environment variable is not set. Please create a .env file with your database connection string.',
            code: 'MISSING_ENV_VAR',
          },
        },
        { status: 500 },
      );
    }

    const data = await listInvoices();
    return Response.json(data, { status: 200 });
  } catch (error: any) {
    // Provide more helpful error messages
    const errorMessage =
      error?.code === 'ECONNREFUSED'
        ? 'Database connection refused. Please ensure your PostgreSQL database is running and the POSTGRES_URL is correct.'
        : error?.message || 'Unknown error occurred';

    return Response.json(
      {
        error: {
          message: errorMessage,
          code: error?.code || 'UNKNOWN_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
