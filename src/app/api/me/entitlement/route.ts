import { getSession } from "@/lib/auth";
import { FREE_ENTITLEMENT, getEntitlement } from "@/lib/entitlement";
import { jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

/** The signed-in user's plan state (guests get the free entitlement). */
export async function GET() {
  const session = await getSession();
  const entitlement = session ? await getEntitlement(session.user.id, session.user.role) : FREE_ENTITLEMENT;
  return jsonOk({ signedIn: Boolean(session), entitlement }, { headers: { "Cache-Control": "no-store" } });
}
