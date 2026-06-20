// GET /api/locandina/<chiave> — serve un file da R2 (pubblico).
// Usata per: locandine eventi, foto galleria E video di presentazione dei corsi.
// Supporta le richieste "Range": indispensabile per riprodurre i video,
// soprattutto su iPhone/Safari (altrimenti il video non parte / non si scorre).
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const key = params.file;
  if (!env.BUCKET || !key) return new Response("Not found", { status: 404 });

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const m = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (m) {
      const start = Number(m[1]);
      const hasEnd = m[2] !== "";
      const end = hasEnd ? Number(m[2]) : undefined;
      const obj = await env.BUCKET.get(key, {
        range: hasEnd ? { offset: start, length: end - start + 1 } : { offset: start }
      });
      if (!obj) return new Response("Not found", { status: 404 });
      const size = obj.size; // dimensione totale dell'oggetto
      const realEnd = hasEnd ? Math.min(end, size - 1) : size - 1;
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("etag", obj.httpEtag);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Content-Range", `bytes ${start}-${realEnd}/${size}`);
      headers.set("Content-Length", String(realEnd - start + 1));
      return new Response(obj.body, { status: 206, headers });
    }
  }

  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
