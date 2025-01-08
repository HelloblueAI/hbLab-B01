export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>
        <p>Please log in to access the protected pages.</p>
        <a href="/api/auth/login">Login</a>
      </div>
    </div>
  );
}
