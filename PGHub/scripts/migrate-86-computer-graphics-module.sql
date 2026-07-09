-- 86: add the Computer Graphics module so /learn/computer-graphics/* concepts can be imported.
-- Idempotent: ON CONFLICT (slug) DO UPDATE keeps the row in sync on re-run.
-- Position 42 slots it after the most recent learn modules. Covers the real-time
-- rendering pipeline — coordinate transforms and the model-view-projection chain,
-- rasterizing triangles into pixels with barycentric coverage and a depth buffer,
-- shading and lighting from the rendering equation down to Blinn-Phong, and ray
-- tracing with recursive reflection and shadow rays — each with an interactive viz.

INSERT INTO public."PGcode_modules" (slug, name, description, position, icon)
VALUES (
  'computer-graphics',
  'Computer Graphics',
  'How a scene becomes pixels — the real-time rendering pipeline from first principles. Homogeneous transforms and the model-view-projection chain that place geometry on screen, rasterization that turns triangles into fragments with barycentric coverage and a depth buffer, shading and lighting from the rendering equation down to diffuse, specular, and Blinn-Phong highlights, and ray tracing with recursive reflection and shadow rays — each concept paired with an interactive transform, rasterizer, shading, and ray-tracing visualization.',
  42,
  'Box'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      position = EXCLUDED.position,
      icon = EXCLUDED.icon;
