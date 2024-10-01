const fetch = require('node-fetch');

// Your GitHub OAuth App credentials
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';

// Step 1: Generate GitHub Authorization URL
function getGitHubAuthURL() {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
  console.log(`Go to this URL and authorize the app: ${authURL}`);
}

// Step 2: Exchange Authorization Code for Access Token
async function getGitHubAccessToken(authCode) {
  const tokenURL = 'https://github.com/login/oauth/access_token';
  
  const response = await fetch(tokenURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log("Access Token:", data.access_token);
    return data.access_token;
  } else {
    console.error(`Error: ${response.status}, ${data.error}`);
    return null;
  }
}

// Step 3: Use Access Token to Access GitHub API
async function getGitHubUserInfo(accessToken) {
  const apiUrl = 'https://api.github.com/user';
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (response.ok) {
    const userData = await response.json();
    console.log("User Info:", userData);
  } else if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
    // Handle Rate Limiting
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));
    const waitTime = resetTime - Math.floor(Date.now() / 1000);
    console.log(`Rate limit exceeded. Retry after ${waitTime} seconds.`);
    setTimeout(() => getGitHubUserInfo(accessToken), waitTime * 1000);
  } else {
    console.error(`Error: ${response.status}, ${await response.text()}`);
  }
}

// Example Usage:
// Step 1: Get Authorization URL and follow the link to get an authorization code
getGitHubAuthURL();

// Step 2: After authorization, replace 'your_auth_code' with the code obtained
// Uncomment the lines below after obtaining the authorization code
// const authCode = 'your_auth_code'; // Get this from the redirect URL after authorization
// const accessToken = await getGitHubAccessToken(authCode);

// Step 3: Use the access token to get user info
// await getGitHubUserInfo(accessToken);
