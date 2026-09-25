reference (fast)  ──► small tests ✓   big tests ✓   ─┐
brute force (slow)──► small tests ✓   big tests ✗   ─┼─► ACCEPT: the tests can tell fast from slow
                                                     │
brute force       ──► big tests ✓ (too fast)       ──┴─► the tests CAN'T tell them apart
                                                           ├─ retry: regenerate with bigger n (max 2)
                                                           └─ still fails → pick one:
                                                               (a) discard, fall back to the template bank
                                                               (b) keep it, but mark it "correctness only" so it
                                                                   never counts as complexity evidence