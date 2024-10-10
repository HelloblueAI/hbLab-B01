import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';

export default function Navigation() {
  const { user, isLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (isLoading) {
    return <nav>Loading...</nav>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">
          <a className="navbar-logo">Your Logo</a>
        </Link>
        <button className="navbar-toggle" onClick={toggleMenu}>
          <span className="navbar-toggle-icon"></span>
        </button>
      </div>
      <ul className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
        <li className="navbar-item">
          <Link href="/">
            <a className="navbar-link">Home</a>
          </Link>
        </li>
        {/* Add more navigation items */}
        <li className="navbar-item">
          <Link href="/about">
            <a className="navbar-link">About</a>
          </Link>
        </li>
        <li className="navbar-item">
          <Link href="/contact">
            <a className="navbar-link">Contact</a>
          </Link>
        </li>
      </ul>
      <div className="navbar-end">
        {user ? (
          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">
              {user.name}
            </a>
            <div className="navbar-dropdown">
              <Link href="/profile">
                <a className="navbar-item">Profile</a>
              </Link>
              <hr className="navbar-divider" />
              <a href="/api/auth/logout" className="navbar-item">
                Logout
              </a>
            </div>
          </div>
        ) : (
          <div className="navbar-item">
            <div className="buttons">
              <a href="/api/auth/login" className="button is-primary">
                <strong>Login</strong>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}