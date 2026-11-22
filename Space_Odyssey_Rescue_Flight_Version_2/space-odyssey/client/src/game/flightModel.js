// Distances are measured in ship lengths. The camera looks down the negative Z axis.
export const FLIGHT_BOUNDS = { x: 9, y: 4 };
const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

export function newFlight(relay) {
  return { relay, x: 0, y: 0, vx: 0, vy: 0, time: 0, hull: 5, streak: 0,
    immune: 0, nextWave: 0, obstacles: [], dockTime: 0, docking: false,
    damage: [], wreckSpawned: false, message: '', messageUntil: 0, result: null, gateX: relay ? -3 : 3, gateY: 1 };
}

export function stepFlight(s, dx, dy, dt, rng = Math.random) {
  if (s.result !== null) return;
  s.time += dt;
  const previousX = s.x, previousY = s.y;
  const ease = 1 - Math.exp(-dt * 9);
  const magnitude = Math.max(1, Math.hypot(dx, dy));
  s.vx += (dx / magnitude * 9 - s.vx) * ease;
  s.vy += (dy / magnitude * 6 - s.vy) * ease;
  s.x = clamp(s.x + s.vx * dt, -FLIGHT_BOUNDS.x, FLIGHT_BOUNDS.x);
  s.y = clamp(s.y + s.vy * dt, -FLIGHT_BOUNDS.y, FLIGHT_BOUNDS.y);
  if (s.time < 13 && s.time >= s.nextWave) {
    s.nextWave = s.time + (s.relay ? .89 : 1.07);
    for (let i = 0; i < 3; i++) {
      s.obstacles.push({ x: i === 0 ? s.x : rng() * 26 - 13, y: i === 0 ? s.y : rng() * 12 - 6,
        z: -52 - i * 6, radius: .7 + rng() * .75, seed: rng(), checked: false });
    }
  }
  if(!s.wreckSpawned && s.time>=7){
    s.wreckSpawned=true;
    // Two torn engine sections frame a flyable gap through the wreck.
    for (const side of [-1,1]) s.obstacles.push({kind:'wreck', x:side*3.4, y:.25,
      z:-43, radius:1.7, seed:side*.17+.5, checked:false});
  }
  for (const rock of s.obstacles) {
    const from = rock.z;
    rock.z += (s.relay ? 20 : 17) * dt;
    if (!rock.checked && from <= 0 && rock.z >= 0) {
      rock.checked = true;
      const u = -from / (rock.z - from);
      const gap = Math.hypot(previousX + (s.x - previousX) * u - rock.x,
        previousY + (s.y - previousY) * u - rock.y) - rock.radius - .58;
      if (gap < 0) {
        s.streak = 0;
        if (s.time >= s.immune) {
          s.damage.push(rock.x < previousX+(s.x-previousX)*u ? -1 : 1);
          s.hull--; s.immune = s.time + 1;
          s.message = 'Hull impact'; s.messageUntil = s.time + .9;
          if (!s.hull) { s.result = false; return; }
        }
      } else if (gap < 1.15) {
        s.streak++;
        s.message = 'Near miss · ' + s.streak + '/3';
        if (s.streak === 3) {
          s.message = s.hull < 5 ? 'Hull repaired +1' : 'Clean pass · hull full';
          if(s.hull<5) s.damage.pop();
          s.hull = Math.min(5, s.hull + 1); s.streak = 0;
        }
        s.messageUntil = s.time + 1;
      }
    }
  }
  s.obstacles = s.obstacles.filter(rock => rock.z < 9);
  if (s.time >= 16.7) {
    s.docking = true;
    const aligned = Math.hypot(s.x - s.gateX, s.y - s.gateY) < 1.32;
    s.dockTime = aligned ? Math.min(1, s.dockTime + dt) : 0;
    if (s.dockTime >= 1) s.result = true;
  }
}
