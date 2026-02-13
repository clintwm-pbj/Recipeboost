const Anthropic = require(’@anthropic-ai/sdk’);

exports.handler = async (event, context) => {
// Only allow POST requests
if (event.httpMethod !== ‘POST’) {
return {
statusCode: 405,
body: JSON.stringify({ error: ‘Method not allowed’ })
};
}

try {
// Parse the request body
const { recipeUrl } = JSON.parse(event.body);

```
if (!recipeUrl) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Recipe URL is required' })
  };
}

// Initialize Anthropic client with API key from environment variable
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch the recipe page content
let recipeContent = '';
try {
  const response = await fetch(recipeUrl);
  const html = await response.text();
  // Extract text content (simplified - just get a preview)
  recipeContent = html.substring(0, 5000); // Limit to first 5000 chars
} catch (fetchError) {
  console.error('Error fetching recipe:', fetchError);
  recipeContent = 'Unable to fetch recipe content. Using URL only.';
}

// Create the prompt for Claude
const prompt = `You are an SEO expert specializing in food blogs and recipe optimization. 
```

A food blogger has provided this recipe URL: ${recipeUrl}

Based on the URL and any available content, generate comprehensive SEO optimization recommendations including:

1. **Schema.org JSON-LD markup** - Create valid Recipe schema markup that includes:
- Recipe name (inferred from URL or content)
- Ingredients (use realistic examples)
- Instructions (use realistic examples)
- Prep time, cook time, total time
- Servings
- Nutrition information
- Author information
- Rating information
1. **SEO Recommendations** - Provide 5-6 actionable SEO tips specific to recipe content
1. **Voice Search Optimization (AEO)** - Suggest optimizations for voice search queries
1. **Social Media Meta Tags** - Generate Open Graph and Twitter Card meta tags

Return your response as a JSON object with this exact structure:
{
“schema”: “the complete JSON-LD schema markup as a string”,
“seoTips”: [“tip 1”, “tip 2”, “tip 3”, “tip 4”, “tip 5”, “tip 6”],
“aeoOptimization”: {
“queries”: [
{“question”: “voice search question 1”, “optimization”: “how to optimize for it”},
{“question”: “voice search question 2”, “optimization”: “how to optimize for it”},
{“question”: “voice search question 3”, “optimization”: “how to optimize for it”}
]
},
“socialTags”: “the complete meta tags as a string”
}

Make the schema realistic and valuable. Extract the recipe name from the URL if possible.`;

```
// Call Claude API
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: prompt
  }]
});

// Extract the response
const responseText = message.content[0].text;

// Try to parse as JSON
let optimizationData;
try {
  optimizationData = JSON.parse(responseText);
} catch (parseError) {
  // If not valid JSON, return a structured error
  console.error('Failed to parse AI response as JSON:', parseError);
  return {
    statusCode: 500,
    body: JSON.stringify({ 
      error: 'Failed to generate optimization data',
      details: responseText 
    })
  };
}

// Return successful response
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(optimizationData)
};
```

} catch (error) {
console.error(‘Error in function:’, error);
return {
statusCode: 500,
headers: {
‘Content-Type’: ‘application/json’,
‘Access-Control-Allow-Origin’: ‘*’
},
body: JSON.stringify({
error: ‘Internal server error’,
message: error.message
})
};
}
};
