import { UserProvider } from '@auth0/nextjs-auth0/client';
import Navigation from './Navigation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <UserProvider>
        <body>
          <Navigation />
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
