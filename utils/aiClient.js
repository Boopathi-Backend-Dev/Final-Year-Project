const https = require('https');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 15000;

function requestJson({ url, method = 'POST', headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = body ? JSON.stringify(body) : '';
    const requestHeaders = {
      ...headers,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };

    const req = https.request(
      {
        method,
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        headers: requestHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch (parseErr) {
            return reject(parseErr);
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`AI API error (${res.statusCode})`);
            err.details = json || data;
            return reject(err);
          }

          return resolve(json);
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('AI API request timed out'));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function buildContextSummary(context = {}) {
  const parts = [];
  if (context.department) parts.push(`Department: ${context.department}`);
  if (context.yearOfStudy) parts.push(`Year of Study: ${context.yearOfStudy}`);
  if (context.cgpa) parts.push(`CGPA: ${context.cgpa}`);
  if (context.skills) parts.push(`Skills: ${context.skills}`);
  return parts.length ? parts.map((item) => `- ${item}`).join('\n') : '- Not provided';
}

async function generateGeminiResponse(message, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const systemPrompt = [
    'You are a helpful academic and career assistant for college students.',
    'Give concise, actionable guidance with clear steps or bullet points.',
    'If you are unsure, say so and suggest next steps.'
  ].join(' ');

  const userPrompt = [
    'Student context:',
    buildContextSummary(context),
    '',
    `User message: ${message}`
  ].join('\n');

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 400
    }
  };

  const response = await requestJson({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    headers: {
      'x-goog-api-key': apiKey
    },
    body: payload
  });

  if (response?.promptFeedback?.blockReason) {
    throw new Error(`AI response blocked: ${response.promptFeedback.blockReason}`);
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part.text).filter(Boolean).join('').trim();
  if (!text) {
    throw new Error('AI API returned an empty response');
  }

  return text;
}

async function generateGroqResponse(message, context = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';
  const systemPrompt = [
    'You are a helpful academic and career assistant for college students.',
    'Give concise, actionable guidance with clear steps or bullet points.',
    'If you are unsure, say so and suggest next steps.'
  ].join(' ');

  const userPrompt = [
    'Student context:',
    buildContextSummary(context),
    '',
    `User message: ${message}`
  ].join('\n');

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 400
  };

  const response = await requestJson({
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: payload
  });

  const content = response?.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error('AI API returned an empty response');
  }

  return String(content).trim();
}

module.exports = {
  generateGeminiResponse,
  generateGroqResponse
};
