import { handleAuth } from '@auth0/nextjs-auth0';
import LoginPage from '../LoginPage';
import LogoutPage from '../LogoutPage';

export const GET = handleAuth({
  login: LoginPage,
  logout: LogoutPage,
});
