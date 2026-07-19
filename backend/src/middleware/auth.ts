import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// This middleware will enforce that a user is authenticated by verifying their Clerk token.
// If valid, it adds `req.auth` to the request object.
export const requireAuth = ClerkExpressRequireAuth();
