# Tuition Management System - Backend

<h2>Project Description</h2>
<p>
This is the backend application of the Tuition Management System. It handles
all server-side logic, database operations, authentication, and API endpoints.
</p>

<h2>Technology Stack</h2>
<ul>
  <li>Backend: Node.js, Express.js</li>
  <li>Database: MongoDB (Mongoose)</li>
  <li>Authentication: JWT, Firebase Admin SDK</li>
  <li>Other: bcrypt, dotenv, cors</li>
</ul>

<h2>Authentication Implementation</h2>
<ul>
  <li>Frontend sends Firebase <strong>idToken</strong> to backend.</li>
  <li>Backend verifies idToken with Firebase Admin SDK.</li>
  <li>On successful verification, backend creates a user if not exist.</li>
  <li>Backend issues <strong>Access Token</strong> and <strong>Refresh Token</strong> for API access.</li>
</ul>

<h2>Authentication Routes</h2>
<ul>
  <li>POST <code>/api/auth/register</code> - Register a new user</li>
  <li>POST <code>/api/auth/login</code> - Login user</li>
  <li>POST <code>/api/auth/firebase-login</code> - Login with Firebase token</li>
  <li>POST <code>/api/auth/refresh-token</code> - Get new access token using refresh token</li>
  <li>POST <code>/api/auth/forgot-password</code> - Send reset password email</li>
  <li>POST <code>/api/auth/reset-password</code> - Reset user password</li>
</ul>

<h2>Features</h2>
<ul>
  <li>User management (CRUD) for Admin</li>
  <li>Course and batch management</li>
  <li>Payment tracking and history</li>
  <li>Role-based access control</li>
  <li>Secure authentication with access/refresh tokens</li>
</ul>
