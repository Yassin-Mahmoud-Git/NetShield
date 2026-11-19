import * as THREE from 'three';

function finalizeColorTexture(canvas: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, anisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createFloorGridTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base slate architectural surface
  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, size, size);

  // Subtle radial vignette
  const grad = ctx.createRadialGradient(size / 2, size / 2, 180, size / 2, size / 2, size * 0.65);
  grad.addColorStop(0, 'rgba(30, 58, 95, 0.22)');
  grad.addColorStop(1, 'rgba(8, 13, 24, 0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine minor grid
  const minorStep = size / 64;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const p = i * minorStep;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
  }
  ctx.stroke();

  // Major structural grid
  const majorStep = size / 16;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const p = i * majorStep;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
  }
  ctx.stroke();

  // Zone divider bands along X (world X from -24 to +24 mapped to 0..2048)
  const worldToPx = (wx: number) => ((wx + 24) / 48) * size;

  const perimeterX = worldToPx(-1.8);
  const fabricX = worldToPx(3.6);
  const coreX = worldToPx(9.2);

  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.beginPath();
  ctx.moveTo(perimeterX, 160);
  ctx.lineTo(perimeterX, size - 160);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
  ctx.beginPath();
  ctx.moveTo(fabricX, 160);
  ctx.lineTo(fabricX, size - 160);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(45, 212, 191, 0.32)';
  ctx.beginPath();
  ctx.moveTo(coreX, 160);
  ctx.lineTo(coreX, size - 160);
  ctx.stroke();
  ctx.restore();

  // Subtle floor zone typography
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
  ctx.textAlign = 'center';
  ctx.fillText('CLIENT LAN · 192.168.10.0/24', worldToPx(-12), size - 190);
  ctx.fillText('PERIMETER & INSPECTION', worldToPx(0.9), size - 190);
  ctx.fillText('DMZ & RESTRICTED CORE · 10.0.0.0/16', worldToPx(13.5), size - 190);

  return finalizeColorTexture(canvas, anisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(2, 6, 14, 0.88)');
  grad.addColorStop(0.55, 'rgba(2, 6, 14, 0.42)');
  grad.addColorStop(1, 'rgba(2, 6, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createMonitorScreenTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09111f';
  ctx.fillRect(0, 0, 512, 288);

  // Browser chrome
  ctx.fillStyle = '#132038';
  ctx.fillRect(0, 0, 512, 36);
  ctx.fillStyle = '#0c1526';
  ctx.fillRect(110, 7, 320, 22);

  // Padlock + URL
  ctx.fillStyle = '#34d399';
  ctx.fillRect(120, 13, 10, 10);
  ctx.font = '500 12px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('https://app.netshield.io/vault', 138, 22);

  // Terminal lines
  const lines = [
    { text: '$ dig +short app.netshield.io', color: '#38bdf8' },
    { text: '10.0.10.25 (DNSSEC VALIDATED)', color: '#34d399' },
    { text: '$ openssl s_client -tls1_3 -connect 10.0.10.25:443', color: '#94a3b8' },
    { text: 'Protocol  : TLSv1.3 · Cipher: TLS_AES_256_GCM_SHA384', color: '#2dd4bf' },
    { text: 'Peer Cert : CN=app.netshield.io (Verified)', color: '#e2e8f0' },
    { text: 'GET /api/telemetry HTTP/2 -> 200 OK (11ms)', color: '#38bdf8' },
  ];

  ctx.font = '400 13px "IBM Plex Mono", monospace';
  lines.forEach((line, idx) => {
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, 24, 76 + idx * 30);
  });

  // Subtle waveform
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 24; x < 488; x += 12) {
    const y = 256 - Math.sin(x * 0.05) * 10 - (x % 36 === 0 ? 12 : 0);
    if (x === 24) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createSwitchFaceplateTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#182235';
  ctx.fillRect(0, 0, 512, 160);

  // Top label bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(12, 10, 488, 22);
  ctx.font = '600 12px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('CORE-SW-01 · 24x 10GbE SFP+ · 802.1Q FABRIC', 22, 25);

  // 2 rows of 12 port sockets
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 12; col++) {
      const px = 22 + col * 34;
      const py = 48 + row * 46;
      ctx.fillStyle = '#050811';
      ctx.fillRect(px, py, 26, 26);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, 26, 26);

      // Link LED
      const active = (row + col) % 3 !== 0;
      ctx.fillStyle = active ? (col > 9 ? '#38bdf8' : '#34d399') : '#334155';
      ctx.fillRect(px + 2, py - 6, 8, 4);
    }
  }

  // Right redundant uplink bays
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(436, 46, 56, 78);
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(436, 46, 56, 78);

  return finalizeColorTexture(canvas, anisotropy);
}

export function createServerBladeTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#121a2b';
  ctx.fillRect(0, 0, 512, 128);

  // Perforated honeycomb/slot drive bays
  for (let i = 0; i < 8; i++) {
    const x = 18 + i * 52;
    ctx.fillStyle = '#090e1a';
    ctx.fillRect(x, 20, 42, 88);
    ctx.strokeStyle = '#293548';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, 20, 42, 88);

    // Status bar
    ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#2dd4bf';
    ctx.fillRect(x + 8, 30, 26, 4);

    // Vent slats
    ctx.fillStyle = '#1e293b';
    for (let v = 0; v < 5; v++) {
      ctx.fillRect(x + 6, 46 + v * 10, 30, 4);
    }
  }

  // Power badge
  ctx.fillStyle = '#34d399';
  ctx.fillRect(454, 52, 24, 24);

  return finalizeColorTexture(canvas, anisotropy);
}

export function createOsiLayerTexture(
  layerNum: number,
  name: string,
  pdu: string,
  protocols: string,
  accentHex: string,
  anisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Perimeter technical frame
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);

  // Inner grid trace
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 64; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 24);
    ctx.lineTo(i, 488);
    ctx.moveTo(24, i);
    ctx.lineTo(488, i);
    ctx.stroke();
  }

  // Layer index
  ctx.font = '700 84px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = accentHex;
  ctx.fillText(`L${layerNum}`, 44, 124);

  // Layer name
  ctx.font = '700 44px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(name, 44, 200);

  // PDU & Protocols
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`PDU: ${pdu}`, 44, 260);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px "IBM Plex Mono", monospace';
  ctx.fillText(protocols, 44, 310);

  // Corner registration marks
  ctx.fillStyle = accentHex;
  ctx.fillRect(44, 440, 140, 8);

  return finalizeColorTexture(canvas, anisotropy);
}
