import { NextResponse, type NextRequest } from "next/server";

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // run a dummy comparison anyway to avoid length-based timing leak
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
    }
    void diff;
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const authUser = process.env["BASIC_AUTH_USER"] ?? "";
  const authPass = process.env["BASIC_AUTH_PASS"] ?? "";

  // If env not configured, block all access (fail closed)
  if (!authUser || !authPass) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="CBV Checklist"' },
    });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const isBasic = authHeader.toLowerCase().startsWith("basic ");

  if (!isBasic) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="CBV Checklist"' },
    });
  }

  const base64 = authHeader.slice("basic ".length);
  let decoded: string;
  try {
    decoded = Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="CBV Checklist"' },
    });
  }

  const colonIdx = decoded.indexOf(":");
  if (colonIdx === -1) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="CBV Checklist"' },
    });
  }

  const user = decoded.slice(0, colonIdx);
  const pass = decoded.slice(colonIdx + 1);

  if (!timingSafeEqual(user, authUser) || !timingSafeEqual(pass, authPass)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="CBV Checklist"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
