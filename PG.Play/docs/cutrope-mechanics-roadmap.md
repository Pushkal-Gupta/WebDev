# Cut-the-Rope-style game — mechanics roadmap

## V1 (this rebuild)

The ten v1 levels exercise these mechanics in order:

| L | World | New mechanic | Existing mechanics | Win-condition twist |
|---|---|---|---|---|
| 1 | Sweet Shop | **Single rope** | — | Drop straight into Mochi. Tutorial: "Tap the rope." |
| 2 | Sweet Shop | **Stars on the swing arc** | rope | Time the cut so candy collects all 3 stars while pendulum swings. |
| 3 | Sweet Shop | **Multi-rope** | rope, stars | Two ropes; cut order changes the trajectory. Tutorial: "Cut order matters." |
| 4 | Sweet Shop | **Pin chain** (anchor → mid-point → candy) | rope, stars | A rope re-routed via a pin; one cut releases a pendulum from a different center. |
| 5 | Greenhouse | **Bubble** | rope, stars | Candy hangs in a bubble; tap-pop the bubble at the right moment. |
| 6 | Greenhouse | **Blower** | rope, stars, bubble | A static blower nudges the candy across a gap; cut + steer. |
| 7 | Greenhouse | **Spike hazard** | rope, stars, bubble | Spike rows force a precise swing arc. |
| 8 | Workshop | **Moving anchor** | rope, stars, bubble, spike | Anchor on a horizontal track; cut while it's at the right phase. |
| 9 | Workshop | **Two ropes + blower** | all above | Combination puzzle. Stars require both ropes cut at different times. |
| 10 | Workshop | **Finale** | all above | Two anchors, one bubble, two blowers, one spike row. |

Per the audit, all ten ship in this rebuild. None require advanced AI;
none require dynamic generation.

## V2 (deferred to a follow-up phase)

| Mechanic | Description | Implementation note |
|---|---|---|
| **Spider / thief** | A creature that descends a rope toward the candy. The player must cut before it arrives. | New entity at `entities/spider.js`. Walks down a chosen rope at constant speed. |
| **Gravity switch** | A pad that, when candy passes through, flips gravity for the next 1.5s. | Cheap: invert verlet `g` for the candy point only. |
| **Teleporters** | Pair of nodes; candy entering one exits the other with conserved speed. | Pair in level data; speed conservation natural in verlet. |
| **Magnetic node** | Static node that pulls the candy radially. | Per-step force application. |
| **Elastic rope** | Rope segment with extra-long rest length and high spring constant. | Variation on existing constraint. |
| **Rotating anchor** | Anchor on a circular path. | Variation on moving-anchor with angular path. |
| **Breakable surface** | Floor tile that shatters on candy impact, opens a path below. | New entity, simple collision response. |
| **Timed switch** | Cut a rope to drop a switch onto a button → opens a door. | Compound mechanic. |

V2 levels: 11–25 (a second world in each of Sweet Shop / Greenhouse /
Workshop, plus a fourth world).

## V3 (long-tail)

- **Box system** — group levels into "boxes" with thumbnails, completion
  ribbons, and a meta-progression.
- **Daily challenge** — a remixed level rotated daily, with a single
  best-attempt leaderboard slot.
- **User-generated levels** — JSON paste-in editor, optional. Likely
  out of scope for a small portal.
- **Power-ups** — one-off helpers (pause time, slow-mo). Risk: dilutes
  the mechanic-purity that gives the genre its identity.

## Out of scope (intentional non-goals)

- Real-time multiplayer.
- Level packs as DLC.
- Procedural level generation.
- Skin / cosmetic packs for the candy.
- Branded character cameos.
