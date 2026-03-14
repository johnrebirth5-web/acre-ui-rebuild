import { activityLogActions, prisma, recordActivityLogEvent } from "@acre/db";
import { getDefaultAppPath } from "@acre/auth";
import { NextRequest, NextResponse } from "next/server";
import { authenticateSeededUser, createSessionCookieValue, getSessionCookieName, getSessionCookieSettings } from "../../../../lib/auth-session";
import { parseLoginCompanyKey } from "../../../../lib/login-companies";
import { getRequestOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const company = parseLoginCompanyKey(String(formData.get("company") ?? "").trim());

  if (company === null || username !== "admin" || password !== "admin") {
    const nextUrl = company ? `/login?company=${company}&error=invalid_credentials` : "/login?error=invalid_credentials";

    return NextResponse.redirect(new URL(nextUrl, requestOrigin), 303);
  }

  const adminMembership = await prisma.membership.findFirst({
    where: {
      status: "active",
      role: "office_admin",
      user: {
        isActive: true
      }
    },
    include: {
      user: true
    },
    orderBy: [{ createdAt: "asc" }]
  });

  const context = adminMembership ? await authenticateSeededUser(adminMembership.user.email) : null;

  if (!context) {
    return NextResponse.redirect(new URL(`/login?company=${company}&error=invalid_credentials`, requestOrigin), 303);
  }

  await recordActivityLogEvent(prisma, {
    organizationId: context.currentOrganization.id,
    membershipId: context.currentMembership.id,
    entityType: "session",
    entityId: context.currentMembership.id,
    action: activityLogActions.authLogin,
    payload: {
      officeId: context.currentOffice?.id ?? null,
      objectLabel: `${context.currentUser.firstName} ${context.currentUser.lastName} · ${context.currentUser.email}`,
      details: [`Role: ${context.currentMembership.role}`, `Office: ${context.currentOffice?.name ?? context.currentOrganization.name}`]
    }
  });

  const response = NextResponse.redirect(new URL(getDefaultAppPath(context.currentMembership.role), requestOrigin), 303);

  response.cookies.set(getSessionCookieName(), createSessionCookieValue(context.currentMembership.id), getSessionCookieSettings());

  return response;
}
