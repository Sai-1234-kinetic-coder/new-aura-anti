/**
 * AuraFit Serverless API Proxy for Google Gemini 1.5 Flash
 * Prevents exposing GEMINI_API_KEY client-side in production.
 * Compatible with Vercel Serverless Functions and Netlify.
 */

export default async function handler(req, res) {
  // CORS Headers for secure client communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Server-side private environment variable (never bundled to frontend JS)
  const serverKey = process.env.GEMINI_API_KEY;
  const clientOverrideKey = req.headers['x-gemini-api-key'];
  const apiKey = serverKey || clientOverrideKey;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'GEMINI_API_KEY not configured on server. Use built-in offline sports engine or provide a key in settings.' 
    });
  }

  try {
    const { systemInstruction, userMessage } = req.body || {};
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction || ''}\n\nUser Question: ${userMessage}` }] }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 350,
          topP: 0.85
        }
      })
    });

    const data = await upstreamRes.json();
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json(data);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Upstream Gemini communication failed' });
  }
}
