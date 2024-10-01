const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const app = express();

// Setup Express session for Passport
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport OAuth2 Strategy setup (use actual OAuth provider URLs and keys)
passport.use(new OAuth2Strategy({
  authorizationURL: 'https://provider.com/oauth2/authorize',
  tokenURL: 'https://provider.com/oauth2/token',
  clientID: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  callbackURL: "http://localhost:3000/auth/provider/callback"
}, 
function(accessToken, refreshToken, profile, cb) {
  // Here you would verify and store the token or user profile
  return cb(null, profile);
}));

// Required to serialize/deserialize user session in Passport
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// OAuth2 Routes
app.get('/auth/provider',
  passport.authenticate('oauth2'));

app.get('/auth/provider/callback',
  passport.authenticate('oauth2', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect to home or another route.
    res.redirect('/success');
  });

app.get('/success', (req, res) => {
  res.send('OAuth Authentication successful');
});

// Rate Limiting Middleware: Limit requests to 100 every 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// External API integration with GitHub as an example
app.get('/api/user/:username', async (req, res) => {
  const username = req.params.username;
  const GITHUB_API = "https://api.github.com";
  
  try {
    const response = await axios.get(`${GITHUB_API}/users/${username}`);
    res.json(response.data);  // Send GitHub user profile data as JSON
  } catch (error) {
    res.status(500).send('Error fetching user data');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Server setup
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
