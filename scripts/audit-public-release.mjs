import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const trackedAndNewFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "buffer" },
)
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const authHeaderPrefix = ["oai", "authenticated", "user"].join("-");
const checks = [
  {
    name: "email address",
    pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  },
  {
    name: "absolute user home path",
    pattern: /(?:\/(?:Users|home)\/[^/\s\0]+\/|[A-Z]:\\Users\\[^\\\s\0]+\\)/gi,
  },
  {
    name: "location-bound retailer parameter",
    pattern: /[?&](?:postal(?:_|-)?code|zip(?:[_-]?code)?|region[_-]?id|store[_-]?(?:code|id)|latitude|longitude)\s*=/gi,
  },
  {
    name: "private conversation reference",
    pattern: /\b(?:earlier|previous|prior)\s+(?:(?:grocery|personal)\s+)?(?:plan|thread|conversation|grocery audit)\b|\byou\s+(?:previously|earlier)\s+said\b|chatgpt-conversation:\/\//gi,
  },
  {
    name: "preselected personal favorite",
    pattern: /\bfavorite\s*:\s*true\b/g,
  },
  {
    name: "account-bound Sites identifier",
    pattern: /\bappg(?:prj|ver|dep)_[a-z0-9_~-]+\b/gi,
  },
  {
    name: "account-bound Sites URL",
    pattern: /https?:\/\/[^\s"']+\.chatgpt\.site\b/gi,
  },
  {
    name: "name or email identity header",
    pattern: new RegExp(`${authHeaderPrefix}-(?:email|full-name)`, "gi"),
  },
  {
    name: "private key material",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    name: "embedded bearer credential",
    pattern: /authorization\s*[:=]\s*["']?bearer\s+[a-z0-9._~-]{16,}/gi,
  },
];

const privateTerms = String(process.env.PUBLIC_RELEASE_DENYLIST || "")
  .split(",")
  .map((term) => term.trim())
  .filter(Boolean);

const findings = [];

for (const file of trackedAndNewFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file).toString("latin1");
  for (const check of checks) {
    check.pattern.lastIndex = 0;
    for (const match of content.matchAll(check.pattern)) {
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      findings.push({ file, line, check: check.name });
    }
  }

  const lowerContent = content.toLowerCase();
  for (const privateTerm of privateTerms) {
    const lowerTerm = privateTerm.toLowerCase();
    let offset = lowerContent.indexOf(lowerTerm);
    while (offset !== -1) {
      const line = content.slice(0, offset).split(/\r?\n/).length;
      findings.push({ file, line, check: "private denylist term" });
      offset = lowerContent.indexOf(lowerTerm, offset + lowerTerm.length);
    }
  }
}

if (findings.length) {
  console.error("Public-release privacy audit failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.check})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Public-release privacy audit passed for ${trackedAndNewFiles.length} files.`);
}
