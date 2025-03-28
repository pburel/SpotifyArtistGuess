
import { Request, Response } from 'express';
import querystring from 'querystring';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://your-repl-url.repl.co/api/auth/callback'
  : 'http://localhost:5000/api/auth/callback';

export function spotifyAuth(req: Request, res: Response) {
  const scope = 'user-read-private user-read-email playlist-read-private';
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    }));
}

export async function spotifyCallback(req: Request, res: Response) {
  const code = req.query.code || null;
  
  if (!code) {
    return res.redirect('/#error=invalid_token');
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({
        code: code as string,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    
    // In a real app, you'd want to store this token securely
    res.redirect('/#token=' + data.access_token);
  } catch (error) {
    res.redirect('/#error=invalid_token');
  }
}
