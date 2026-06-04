-- Migration 0002: Seed admin user
-- Login: sekani@rald.cloud (or username: sekani)
-- Password: Fakiyeomotomiwa1$ (PBKDF2-SHA256, 100000 iterations)
-- Change via Settings > Change Password after first login.
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'sekani',
  'sekani@rald.cloud',
  'pbkdf2:c9180e83759643c52e8320120d05e0af:f6424b7d7f9cf392a22b61ec30f43e3e038d3cb5239d5517e0fc3757176e6f81',
  'admin',
  1
);
