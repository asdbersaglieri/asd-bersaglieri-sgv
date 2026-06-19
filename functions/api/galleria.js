// GET /api/galleria            -> elenco album (con copertina e numero foto)  [pubblico]
// GET /api/galleria?album=ID   -> dati album + sue foto                        [pubblico]
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    if (!env.DB) return json({ albums: [] });
    const url = new URL(request.url);
    const albumId = url.searchParams.get("album");

    if (albumId) {
      const a = await env.DB.prepare("SELECT id,nome FROM album WHERE id = ?").bind(Number(albumId)).first();
      const { results } = await env.DB.prepare(
        "SELECT id,chiave FROM foto WHERE album_id = ? ORDER BY id ASC"
      ).bind(Number(albumId)).all();
      return json({ album: a || null, foto: results || [] });
    }

    const { results } = await env.DB.prepare(
      `SELECT a.id, a.nome, a.copertina,
              (SELECT COUNT(*) FROM foto f WHERE f.album_id = a.id) AS n
       FROM album a ORDER BY a.created_at DESC`
    ).all();
    return json({ albums: results || [] });
  } catch (e) { return json({ albums: [] }); }
}
function json(o, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
