// Constants shared between heightmap.js and chunkManager.js. Lives in its
// own file so heightmap doesn't have to import from chunkManager (which
// pulls in three.js and the trap registry — too heavy for a math module).

export const CHUNK_LENGTH = 64;     // metres along Z per chunk
export const CHUNK_HALF_W = 32;     // metres either side of the corridor centerline
