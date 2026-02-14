const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { recipeUrl } = JSON.parse(event.body);

    if (!recipeUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Recipe URL is required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an SEO expert for food blogs. Analyze this recipe URL: ${recipeUrl}

Generate SEO optimization as a JSON object with this structure:
{
  "schema": "complete JSON-LD schema markup as a string",
  "seoTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "aeoOptimization": {
    "queries": [
      {"question": "voice search question", "optimization": "how to optimize"}
    ]
  },
  "socialTags": "complete meta tags as a string"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    let responseText = message.content[0].text;

// Strip markdown code blocks if present
responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

const optimizationData = JSON.parse(responseText);


    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(optimizationData)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
