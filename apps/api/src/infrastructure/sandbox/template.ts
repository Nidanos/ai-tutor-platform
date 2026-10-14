import { Template, waitForTimeout } from "e2b";

// The machine every run starts from. Debian 13 ships clang 19 (ADR-0002); `time` reports peak memory.
export const SANDBOX_TEMPLATE = "ai-tutor-cpp";

// Compiling once during the build leaves clang and every standard header in the snapshot's memory,
// so the first real compile in each sandbox doesn't wait on a cold disk.
const WARM_UP =
  "printf '#include <bits/stdc++.h>\nint main() {}\n' > /tmp/warm.cpp" +
  " && clang++-19 -std=c++20 -O2 -o /tmp/warm /tmp/warm.cpp; sleep infinity";

export const sandboxTemplate = Template()
  .fromDebianImage("trixie")
  .aptInstall(["clang-19", "libstdc++-14-dev", "time"], { noInstallRecommends: true })
  .setStartCmd(WARM_UP, waitForTimeout(30_000));
