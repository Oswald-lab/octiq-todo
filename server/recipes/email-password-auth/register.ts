// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { setIdentityResolver } from '../../utils/identity.js';
import { bearerFrom, verifyAccessToken } from './session.js';

// Fills the starter's identity slot so recipes that merely ATTRIBUTE a row to
// the caller (payments) can do so without depending on this recipe.
setIdentityResolver(async (req) => {
  const token = bearerFrom(req);
  if (!token) return null;
  const user = await verifyAccessToken(token);
  return user ? { userId: user.userId, email: user.email, phone: user.phone, role: user.role } : null;
});
// ─── @octiq-extend ─── your code below this line ───
