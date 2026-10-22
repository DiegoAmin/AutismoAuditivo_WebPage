export default async function handler(req, res) {
  const { artist } = req.query;

  if (!artist) {
    return res.status(400).json({ error: 'Falta el nombre del artista' });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    // 1. Pedirle permiso a Spotify con tus llaves
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();

    // 2. Buscar exactamente al artista que ganó en la ruleta
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    const searchData = await searchResponse.json();

    // 3. Regresar su Link oficial y su Foto
    if (searchData.artists && searchData.artists.items.length > 0) {
      const foundArtist = searchData.artists.items[0];
      return res.status(200).json({
        url: foundArtist.external_urls.spotify,
        image: foundArtist.images.length > 0 ? foundArtist.images[0].url : null
      });
    } else {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}