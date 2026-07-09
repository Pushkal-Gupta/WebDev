-- 85: add the Cryptography module so /learn/cryptography/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 41 slots it after the most recent learn modules. Distinct from Web Security
-- (that module covers attacks and defenses — XSS, CSRF, injection); this one covers the
-- cryptographic primitives themselves — hash functions, symmetric ciphers, public-key
-- crypto and RSA, digital signatures and the TLS trust chain — with interactive
-- hashing, block-cipher, RSA, and TLS-handshake visualizations.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'cryptography',
  'Cryptography',
  'The primitives that make secrecy and trust possible on an open network — one-way hash functions with preimage and collision resistance for fingerprints and password storage, symmetric ciphers like AES with their block modes and the key-distribution problem, public-key cryptography and RSA that let strangers exchange secrets without a shared key, and the digital signatures, certificates, and TLS handshake that bind an identity to a key so you know who you are talking to — each explained with an interactive hashing, block-cipher, RSA, and handshake visualization.',
  41,
  'KeyRound'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
