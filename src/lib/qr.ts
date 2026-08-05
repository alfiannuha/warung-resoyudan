/**
 * Minimal, dependency-free QR Code generator (byte mode).
 *
 * Vendored for Warung Resoyudan receipts — produces a QR module matrix
 * (boolean[][], true = dark) that can be rasterized for ESC/POS thermal
 * printing. Implements the standard QR encoding: byte mode, Reed-Solomon
 * error correction, mask selection. Payloads here are short ASCII strings
 * (e.g. the receipt JSON), so version selection stays small (≤ v10).
 *
 * This is a self-contained implementation (Nayuki-style) — no canvas, no
 * DOM, no network. Pure functions only, fully unit-testable.
 */

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

// ── Reed-Solomon error correction tables ──

const ECC_CODEWORDS_PER_BLOCK: Record<QrErrorCorrection, number[]> = {
  // [version][0] is unused (versions are 1-indexed); length 41.
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

const NUM_ERROR_CORRECTION_BLOCKS: Record<QrErrorCorrection, number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

/** Reed-Solomon generator polynomial degree table (per ECC codeword count). */
function rsGeneratorPoly(degree: number): number[] {
  // Multiply (x - r^0)(x - r^1)...(x - r^(degree-1)) in GF(2^8) with
  // primitive polynomial 0x11D.
  const result = [1];
  for (let i = 0; i < degree; i++) {
    const next: number[] = new Array(result.length + 1).fill(0);
    for (let j = 0; j < result.length; j++) {
      next[j] ^= gfMul(result[j], 0x02 ** i % 0x100); // r^i
      next[j + 1] ^= result[j];
    }
    result.length = next.length;
    for (let j = 0; j < next.length; j++) result[j] = next[j];
  }
  return result;
}

const GF_EXP = new Int32Array(512);
const GF_LOG = new Int32Array(256);
(function initGf() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

/** Computes ECC codewords for `data` using the generator for `eccLen` codewords. */
function rsComputeRemainder(data: number[], eccLen: number): number[] {
  const gen = rsGeneratorPoly(eccLen);
  const factor = gen.length - 1;
  const result = new Array(eccLen).fill(0);
  for (const byte of data) {
    const factor2 = byte ^ result.shift()!;
    result.push(0);
    for (let i = 0; i < factor; i++) {
      result[i] ^= gfMul(gen[i], factor2);
    }
  }
  return result;
}

// ── QR version / capacity ──

const ALIGNMENT_PATTERN_POSITIONS: number[][] = [
  [],
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
  [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

/** Version capacity in bits for byte mode, by ECC level. */
const BYTE_CAPACITY_BITS: Record<QrErrorCorrection, number[]> = {
  L: [0, 152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192, 2592, 2960, 3424, 3680, 4256, 4664, 5240, 5744, 6264, 6752, 7424, 7936, 8592, 9144, 9888, 10528, 11296, 12160, 13088, 13824, 14912, 15536, 16352, 17312, 18096, 18864, 19952, 21072, 21968, 23024],
  M: [0, 128, 224, 352, 512, 688, 864, 992, 1232, 1456, 1728, 2032, 2320, 2672, 2920, 3320, 3624, 4056, 4504, 5016, 5352, 5712, 6256, 6880, 7312, 8000, 8496, 9024, 9544, 10136, 10984, 11640, 12328, 13048, 13800, 14496, 15312, 15936, 16816, 17728, 18672],
  Q: [0, 104, 176, 272, 384, 496, 608, 704, 880, 1056, 1232, 1440, 1648, 1952, 2088, 2360, 2600, 2936, 3176, 3560, 3880, 4096, 4544, 4912, 5312, 5744, 6032, 6464, 6968, 7288, 7880, 8264, 8920, 9368, 9848, 10288, 10864, 11408, 12016, 12656, 13328],
  H: [0, 72, 128, 208, 288, 368, 480, 528, 688, 800, 976, 1120, 1264, 1440, 1576, 1784, 2024, 2264, 2504, 2728, 3080, 3248, 3536, 3712, 4112, 4304, 4768, 4992, 5352, 5712, 6256, 6368, 6880, 7152, 7392, 7864, 8360, 8632, 9128, 9504, 9952],
};

// ── Matrix helpers ──

export interface QrCode {
  /** Size in modules (e.g. 21 for v1, 25 for v2 ...). */
  size: number;
  /** Grid of modules: [y][x], true = dark. */
  modules: boolean[][];
  /** QR version (1..40). */
  version: number;
  /** Error correction level used. */
  errorCorrection: QrErrorCorrection;
}

/**
 * Generates a QR Code for the given text (byte mode, ASCII-safe payloads).
 * Throws if the payload is too large for v40.
 */
export function generateQRMatrix(
  text: string,
  errorCorrection: QrErrorCorrection = "M",
): QrCode {
  const data = Array.from(text, (c) => c.charCodeAt(0) & 0xff);

  // 1. Choose the smallest version that fits.
  const ec = errorCorrection;
  let version = 1;
  for (; version <= 40; version++) {
    const bits = BYTE_CAPACITY_BITS[ec][version];
    // Byte mode overhead: 4-bit mode indicator + 8-bit (v1-9) / 16-bit (v10-40) char count.
    const overhead = 4 + (version <= 9 ? 8 : 16);
    if (data.length * 8 + overhead <= bits) break;
  }
  if (version > 40) {
    throw new Error("Data too long for a QR Code");
  }

  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

  // 2. Draw function patterns.
  drawFunctionPatterns(modules, isFunction, size, version);

  // 3. Build the data + ECC codewords and interleave.
  const rawData = buildCodewords(data, version, ec);

  // 4. Place bits in zigzag, skipping function areas, with mask 0 first.
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const test = modules.map((row) => row.slice());
    placeBits(test, isFunction, size, rawData, mask);
    const penalty = calculatePenalty(test, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
  }

  // 5. Final placement with best mask + format info.
  placeBits(modules, isFunction, size, rawData, bestMask);
  drawFormatBits(modules, isFunction, size, ec, bestMask);

  return { size, modules, version, errorCorrection: ec };
}

function drawFunctionPatterns(
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
  version: number,
) {
  // Finder patterns + separators.
  for (const [x, y] of [[0, 0], [size - 7, 0], [0, size - 7]] as const) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || xx >= size || yy < 0 || yy >= size) continue;
        const inRing = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const dark =
          inRing &&
          (dx === 0 || dx === 6 || dy === 0 || dy === 6 ||
            (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        modules[yy][xx] = dark;
        isFunction[yy][xx] = true;
      }
    }
  }

  // Alignment patterns.
  const positions = ALIGNMENT_PATTERN_POSITIONS[version];
  for (const cy of positions) {
    for (const cx of positions) {
      if (isFunction[cy][cx]) continue; // skip finder overlaps
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const xx = cx + dx;
          const yy = cy + dy;
          const dark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
          modules[yy][xx] = dark;
          isFunction[yy][xx] = true;
        }
      }
    }
  }

  // Timing patterns.
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) {
      modules[6][i] = i % 2 === 0;
      isFunction[6][i] = true;
    }
    if (!isFunction[i][6]) {
      modules[i][6] = i % 2 === 0;
      isFunction[i][6] = true;
    }
  }

  // Dark module (always true) at (8, size-8).
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Version info for v >= 7.
  if (version >= 7) {
    drawVersionBits(modules, isFunction, size, version);
  }
}

function drawVersionBits(
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
  version: number,
) {
  let bits = version;
  for (let i = 0; i < 12; i++) {
    bits = (bits << 1) ^ ((bits >>> 11) * 0x1f25);
  }
  const rem = bits; // 18-bit BCH code
  const data = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const bit = ((data >>> i) & 1) !== 0;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    modules[b][a] = bit;
    modules[a][b] = bit;
    isFunction[b][a] = true;
    isFunction[a][b] = true;
  }
}

function drawFormatBits(
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
  ec: QrErrorCorrection,
  mask: number,
) {
  const ecBits = { L: 1, M: 0, Q: 3, H: 2 }[ec];
  let data = (ecBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  data = (data << 10 | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) {
    const bit = ((data >>> i) & 1) !== 0;
    modules[i][8] = bit;
    isFunction[i][8] = true;
  }
  modules[7][8] = ((data >>> 6) & 1) !== 0;
  isFunction[7][8] = true;
  modules[8][8] = ((data >>> 7) & 1) !== 0;
  isFunction[8][8] = true;
  modules[8][7] = ((data >>> 8) & 1) !== 0;
  isFunction[8][7] = true;
  for (let i = 9; i < 15; i++) {
    const bit = ((data >>> i) & 1) !== 0;
    modules[8][14 - i] = bit;
    isFunction[8][14 - i] = true;
  }
  // Mirror side.
  for (let i = 0; i < 8; i++) {
    const bit = ((data >>> i) & 1) !== 0;
    modules[size - 1 - i][8] = bit;
    isFunction[size - 1 - i][8] = true;
  }
  for (let i = 8; i < 15; i++) {
    const bit = ((data >>> i) & 1) !== 0;
    modules[8][size - 15 + i] = bit;
    isFunction[8][size - 15 + i] = true;
  }
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;
}

function buildCodewords(data: number[], version: number, ec: QrErrorCorrection): number[] {
  const eccLen = ECC_CODEWORDS_PER_BLOCK[ec][version];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ec][version];

  // Segment header: byte mode (0100), char count (8 bits for v1-9, 16 for v10-40).
  const bits: boolean[] = [];
  pushBits(bits, 0b0100, 4);
  pushBits(bits, data.length, version <= 9 ? 8 : 16);
  for (const b of data) pushBits(bits, b, 8);

  // Pad to capacity with 0xEC, 0x11 alternation.
  const capacityBits = BYTE_CAPACITY_BITS[ec][version];
  while (bits.length % 8 !== 0) bits.push(false);
  const padBytes = [
    0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
    0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
  ];
  let i = 0;
  while (bits.length < capacityBits) {
    pushBits(bits, padBytes[i++ % padBytes.length], 8);
  }

  // Convert to codeword bytes.
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ? 1 : 0);
    codewords.push(byte);
  }

  // Split into blocks, compute ECC per block, interleave.
  const dataPerBlock = Math.floor(codewords.length / numBlocks);
  const shortBlocks = numBlocks - (codewords.length % numBlocks);
  const blocks: number[][] = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = dataPerBlock + (b >= shortBlocks ? 1 : 0);
    blocks.push(codewords.slice(offset, offset + len));
    offset += len;
  }
  const eccBlocks = blocks.map((blk) => rsComputeRemainder(blk, eccLen));

  const result: number[] = [];
  for (let i = 0; i < dataPerBlock + 1; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < blocks[b].length) result.push(blocks[b][i]);
    }
  }
  for (let i = 0; i < eccLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      result.push(eccBlocks[b][i]);
    }
  }
  return result;
}

function pushBits(bits: boolean[], value: number, len: number) {
  for (let i = len - 1; i >= 0; i--) {
    bits.push(((value >>> i) & 1) !== 0);
  }
}

function placeBits(
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
  data: number[],
  mask: number,
) {
  const bitIndex = new Int32Array(data.length * 8);
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < 8; j++) {
      bitIndex[i * 8 + j] = (data[i] >>> (7 - j)) & 1;
    }
  }

  let idx = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // skip timing column
    for (let rowOffset = 0; rowOffset < size; rowOffset++) {
      const row = upward ? size - 1 - rowOffset : rowOffset;
      for (let j = 0; j < 2; j++) {
        const x = col - j;
        if (isFunction[row][x]) continue;
        let bit = false;
        if (idx < bitIndex.length) bit = bitIndex[idx++] === 1;
        modules[row][x] = bit !== (maskFunction(mask, row, x));
      }
    }
    upward = !upward;
  }
}

function maskFunction(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return (x * y) % 2 + (x * y) % 3 === 0;
    case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
    case 7: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    default: throw new Error("Invalid mask");
  }
}

function calculatePenalty(modules: boolean[][], size: number): number {
  let penalty = 0;

  // Rule 1: runs of 5+ same-color modules in rows/cols.
  for (let y = 0; y < size; y++) {
    let runColor: boolean | null = null;
    let runLen = 0;
    for (let x = 0; x < size; x++) {
      const c = modules[y][x];
      if (c === runColor) {
        runLen++;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty++;
      } else {
        runColor = c;
        runLen = 1;
      }
    }
  }
  for (let x = 0; x < size; x++) {
    let runColor: boolean | null = null;
    let runLen = 0;
    for (let y = 0; y < size; y++) {
      const c = modules[y][x];
      if (c === runColor) {
        runLen++;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty++;
      } else {
        runColor = c;
        runLen = 1;
      }
    }
  }

  // Rule 2: 2x2 blocks of same color.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        penalty += 3;
      }
    }
  }

  // Rule 3: finder-like pattern 1011101 with 0000 on either side.
  const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x <= size - 11; x++) {
      const row = modules[y];
      if (matchesPattern(row, x, pattern1) || matchesPattern(row, x, pattern2)) penalty += 40;
    }
  }
  for (let x = 0; x < size; x++) {
    for (let y = 0; y <= size - 11; y++) {
      const col = Array.from({ length: size }, (_, yy) => modules[yy][x]);
      if (matchesPattern(col, y, pattern1) || matchesPattern(col, y, pattern2)) penalty += 40;
    }
  }

  // Rule 4: proportion of dark modules.
  let dark = 0;
  for (const row of modules) for (const m of row) if (m) dark++;
  const total = size * size;
  const k = Math.floor(Math.abs(dark * 20 - total * 10) / total);
  penalty += k * 10;

  return penalty;
}

function matchesPattern(row: boolean[], start: number, pattern: boolean[]): boolean {
  for (let i = 0; i < pattern.length; i++) {
    if (row[start + i] !== pattern[i]) return false;
  }
  return true;
}
