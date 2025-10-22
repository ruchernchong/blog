import { UAParser } from "ua-parser-js";

type ParsedUA = {
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
};

const parseUserAgent = (userAgent: string): ParsedUA => {
  const parser = new UAParser(userAgent);

  return {
    browser: parser.getBrowser().name,
    os: parser.getOS().name,
    device: parser.getDevice().type ?? "desktop", // UAParser does not identify "desktop" type
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
};

export default parseUserAgent;
