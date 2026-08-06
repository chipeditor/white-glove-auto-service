import { fetchCustomers } from '@/lib/queries';

export async function GET() {
  const customers = await fetchCustomers();
  return Response.json(customers);
}
