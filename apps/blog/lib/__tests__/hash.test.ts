import { generateUserHash } from "../hash";

describe("generateUserHash", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("generates consistent hash for same IP", () => {
    process.env.IP_SALT = "test-salt";
    const ip = "192.168.1.1";
    const hash1 = generateUserHash(ip);
    const hash2 = generateUserHash(ip);

    expect(hash1).toBe(hash2);
  });

  it("generates different hashes for different IPs", () => {
    process.env.IP_SALT = "test-salt";
    const hash1 = generateUserHash("192.168.1.1");
    const hash2 = generateUserHash("192.168.1.2");

    expect(hash1).not.toBe(hash2);
  });

  it("generates different hashes with different salts", () => {
    const ip = "192.168.1.1";

    process.env.IP_SALT = "salt1";
    const hash1 = generateUserHash(ip);

    process.env.IP_SALT = "salt2";
    const hash2 = generateUserHash(ip);

    expect(hash1).not.toBe(hash2);
  });

  it("returns 8-character hash", () => {
    process.env.IP_SALT = "test-salt";
    const hash = generateUserHash("192.168.1.1");

    expect(hash).toHaveLength(8);
  });

  it("returns hexadecimal string", () => {
    process.env.IP_SALT = "test-salt";
    const hash = generateUserHash("192.168.1.1");

    expect(hash).toMatch(/^[a-f0-9]{8}$/);
  });

  it("handles undefined salt gracefully", () => {
    delete process.env.IP_SALT;
    const hash = generateUserHash("192.168.1.1");

    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[a-f0-9]{8}$/);
  });
});
