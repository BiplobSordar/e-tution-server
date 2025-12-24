<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 1100px; margin: auto;">

<h1 style="text-align:center; color:#16a34a;">🖥️ eTuitionBd – Backend / Server (SSR)</h1>

<p style="text-align:center; font-size:16px; color:#374151;">
Robust, secure, and scalable backend server for the <b>eTuitionBd Tuition Management System</b>, handling authentication, role-based authorization, tuition workflows, payments, and admin operations.
</p>

<hr/>

<h2 style="color:#1f2937;"> Server Purpose</h2>
<ul>
  <li>Provide secure REST APIs for client-side operations</li>
  <li>Handle authentication, JWT verification, and role-based access</li>
  <li>Manage tuition posts, tutor applications, and approvals</li>
  <li>Process Stripe payments and track transactions</li>
  <li>Enable admin moderation, analytics, and reporting</li>
</ul>

<hr/>

<h2 style="color:#1f2937;"> Server Live URL</h2>
<p>
🔗 <b>API Base URL:</b> <span style="color:#6b7280;"><a href='https://e-tution-server.vercel.app'>E-tution-server<a/></span>
</p>

<hr/>

<h2 style="color:#1f2937;"> Technology Stack (Server)</h2>

<table style="width:100%; border-collapse: collapse;">
  <tr style="background:#f3f4f6;">
    <th style="padding:10px; border:1px solid #e5e7eb;">Category</th>
    <th style="padding:10px; border:1px solid #e5e7eb;">Technologies</th>
  </tr>
  <tr>
    <td style="padding:10px; border:1px solid #e5e7eb;">Runtime</td>
    <td style="padding:10px; border:1px solid #e5e7eb;">Node.js</td>
  </tr>
  <tr>
    <td style="padding:10px; border:1px solid #e5e7eb;">Framework</td>
    <td style="padding:10px; border:1px solid #e5e7eb;">Express.js (v5)</td>
  </tr>
  <tr>
    <td style="padding:10px; border:1px solid #e5e7eb;">Database</td>
    <td style="padding:10px; border:1px solid #e5e7eb;">MongoDB (Mongoose)</td>
  </tr>
  <tr>
    <td style="padding:10px; border:1px solid #e5e7eb;">Authentication</td>
    <td style="padding:10px; border:1px solid #e5e7eb;">Firebase Admin, JWT</td>
  </tr>
  <tr>
    <td style="padding:10px; border:1px solid #e5e7eb;">Payment</td>
    <td style="padding:10px; border:1px solid #e5e7eb;">Stripe</td>
  </tr>
</table>

<hr/>

<h2 style="color:#1f2937;"> Core Backend Features</h2>

<h3> Authentication & Security</h3>
<ul>
  <li>Firebase Admin authentication verification</li>
  <li>JWT generation & validation</li>
  <li>Role-based access control (Student / Tutor / Admin)</li>
  <li>Password hashing using bcrypt</li>
  <li>Secure cookies & HTTP-only tokens</li>
</ul>

<h3> Tuition Management APIs</h3>
<ul>
  <li>Create, update, delete tuition posts (Student)</li>
  <li>Admin approval / rejection system</li>
  <li>Public tuition listing (only approved posts)</li>
  <li>Search, filter, sort, and pagination support</li>
</ul>

<h3> Tutor Application System</h3>
<ul>
  <li>Apply to tuition posts</li>
  <li>Application status tracking</li>
  <li>Automatic rejection after tutor approval</li>
</ul>

<h3> Payment & Transactions</h3>
<ul>
  <li>Stripe payment intent creation</li>
  <li>Payment verification via webhook</li>
  <li>Tutor approval only after successful payment</li>
  <li>Transaction history & revenue tracking</li>
</ul>

<h3> Admin Operations</h3>
<ul>
  <li>User management (CRUD)</li>
  <li>Role modification (Student / Tutor / Admin)</li>
  <li>Tuition moderation</li>
  <li>Reports & analytics APIs</li>
</ul>

<hr/>

<h2 style="color:#1f2937;"> NPM Packages Used</h2>

<pre style="background:#020617; color:#e5e7eb; padding:15px; border-radius:8px;">
bcryptjs
cloudinary
cookie-parser
cors
dotenv
express
firebase-admin
jsonwebtoken
mongoose
morgan
stripe
</pre>

<hr/>

<h2 style="color:#1f2937;">⚙️ Environment Variables</h2>

<p>Create a <code>.env</code> file in the root of the server project:</p>

```env
FRONTEND_URL=your_frontend_url
MONGO_URI=your_mongoDb_uri
PORT=5000
JWT_ACCESS_SECRET=your_jwt_access_token_sec

JWT_REFRESH_SECRET=your_jwt_ref_tok_sec

FIREBASE_SERVICE_ACCOUNT_BASE64=your_firebase_admin_sdl_creadential

# cloudnary env

CLOUDINARY_CLOUD_NAME=your_cloudnary_creadentials
CLOUDINARY_API_KEY=your_cloudnary_creadentials
CLOUDINARY_API_SECRET=your_cloudnary_creadentials


# stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

<hr/>
 <h2 style="color:#1f2937;"> Installation & Run Guide</h2>

# Clone the repository
```
git clone https://github.com/BiplobSordar/e-tution-server.git
```
# Navigate to project directory
```
cd e-tution-server
```



# Install dependencies
```
npm install
```

# Run development server
```
npm run dev
```

# Run production server
```
npm start
```
