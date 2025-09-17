const UPSTREAM = "http://bff-service.services.svc.cluster.local";

export async function POST(req: Request) {
    const form = await req.formData();
    // optional: forward auth if present
    const auth = req.headers.get("authorization") || undefined;

    const r = await fetch(`${UPSTREAM}/api/upload`, {
        method: "POST",
        headers: auth ? { Authorization: auth } : undefined,
        body: form,         // don't set Content-Type; fetch will do it for FormData
    });

    return new Response(r.body, {
        status: r.status,
        headers: r.headers,
    });
}
