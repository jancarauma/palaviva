import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, lang } = req.query;

  try {
    const response = await axios.get(
      `https://translate.google.com/translate_tts`,
      {
        params: {
          ie: 'UTF-8',
          tl: lang,
          client: 'tw-ob',
          q: text,
        },
        responseType: 'stream'
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
}