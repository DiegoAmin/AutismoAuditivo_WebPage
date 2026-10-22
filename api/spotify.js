const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  const { artist, searchTrack, searchAlbum } = req.query;

  try {
    const token = await getSpotifyToken();

    // 1. Búsqueda de canciones
    if (searchTrack) {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTrack)}&type=track&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items) {
        return res.status(200).json([]);
      }

      const tracks = data.tracks.items.map(t => ({
        name: t.name || 'Desconocido',
        artist: t.artists ? t.artists.map(a => a.name).join(', ') : 'Desconocido',
        image: t.album && t.album.images && t.album.images[0] ? t.album.images[0].url : null,
        url: t.external_urls ? t.external_urls.spotify : ''
      }));
      return res.status(200).json(tracks);
    }

    // 2. Búsqueda de álbumes
    if (searchAlbum) {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchAlbum)}&type=album&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.albums || !data.albums.items) {
        return res.status(200).json([]);
      }

      const albums = data.albums.items.map(a => ({
        name: a.name || 'Desconocido',
        artist: a.artists ? a.artists.map(art => art.name).join(', ') : 'Desconocido',
        image: a.images && a.images[0] ? a.images[0].url : null,
        url: a.external_urls ? a.external_urls.spotify : ''
      }));
      return res.status(200).json(albums);
    }

    // 3. Búsqueda de artista
    if (!artist) {
      return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (!data.artists || !data.artists.items.length) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    const artistData = data.artists.items[0];
    return res.status(200).json({
      name: artistData.name,
      url: artistData.external_urls ? artistData.external_urls.spotify : '',
      image: artistData.images && artistData.images[0] ? artistData.images[0].url : null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}