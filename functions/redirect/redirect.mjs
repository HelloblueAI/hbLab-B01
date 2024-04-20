// Docs on event and context https://docs.netlify.com/functions/build-with-javascript/
export async function handler(event) {
  try {
    const userAgent = event.headers['user-agent'] ? event.headers['user-agent'].toLowerCase() : '';

    let location;

    if (userAgent.includes('android')) {
      location = 'https://play.google.com/store/apps/details?id=com.cloudtenlabs.helloblue';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      location = 'https://apps.apple.com/app/id6450708010';
    } else {
      // Default redirect if OS is not recognized or user-agent header is missing
      location = 'https://helloblue.ai';
    }

    // Redirect to the detected app store or default page
    return {
      statusCode: 302,
      headers: {
        'Location': location
      }
    };
  } catch (error) {
    // If there's an error, return a server error code and message
    return { statusCode: 500, body: error.toString() };
  }
}
