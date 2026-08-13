#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const context = { window: {} };
vm.runInNewContext(readFileSync(resolve(HERE, "../app/data.js"), "utf8"), context);
const sources = context.window.APPLIANCE_DATA.sources;
const queue = [...sources];
const failures = [];

async function worker() {
  while (queue.length) {
    const source = queue.shift();
    try {
      const response = await fetch(source.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
        headers: { "user-agent": "Mozilla/5.0 washer-data-link-check/1.0" }
      });
      if (!response.ok) failures.push(`${response.status} ${source.id} ${source.url}`);
    } catch (error) {
      failures.push(`ERR ${source.id} ${source.url} (${error.message})`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`リンク確認失敗: ${failures.length}/${sources.length}`);
  process.exit(1);
}
console.log(`リンク確認成功: ${sources.length}件すべてメーカー公式ページへ到達`);
