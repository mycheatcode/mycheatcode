// app/api/echo/route.ts

export async function POST(req: Request) {
  const id = crypto.randomUUID();
  const startedAt = Date.now();

  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const last = body?.messages?.at?.(-1) ?? body?.text ?? '';
  console.log('[echo] start', { id, last, count: body?.messages?.length ?? 0 });

  return new Response(
    JSON.stringify({
      id,
      reply: typeof last === 'string' ? `echo: ${last}` : 'echo: (no text)',
      startedAt,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}
