# Performance Optimization: From UI Freezes to 60fps

## Problem Statement

A crypto DCA (Dollar Cost Averaging) backtester application was experiencing noticeable UI freezes when users changed parameters (investment amount, dates, strategies, coin selection). The app would become unresponsive for 200-300ms, making interactions feel sluggish.

## Root Cause Analysis

The application runs two types of computations when settings change:

1. **Strategy Backtests** (ResultsContext) — calculates returns for 1-4 active investment strategies
2. **Sensitivity Analysis** (ReturnHeatmap) — computes returns across different start dates and holding periods

Both were running **synchronously on the main thread**, blocking all user interactions, rendering, and event handling.

## Investigation Phase

### Measuring Before Optimization

We added performance markers to identify the actual bottleneck:

```
2 active strategies:    ~9.60ms ✓ Already fast
3 active strategies:   ~12.40ms ✓ Still fast
4 active strategies:   ~20.70ms ✓ Acceptable

Sensitivity Analysis:  262.60ms ✗ TOO SLOW
```

**Key Finding:** Strategy backtests were already fast (~10-20ms), but sensitivity analysis was the real culprit at 260ms+.

## Evaluation of Approaches

### Approach 1: Web Workers ✅

Offload CPU-intensive calculations to a background thread.

**Pros:**

- Main thread remains completely free
- UI stays responsive during computation
- Best for long-running tasks (100ms+)

**Cons:**

- Higher complexity (thread communication, serialization)
- More memory overhead
- Overkill for simple calculations

**Decision:** ✅ Use for sensitivity analysis (260ms), skip for backtests (9-20ms)

### Approach 2: startTransition + Deferred Updates ✅

Mark state updates as non-urgent, allowing the browser to render frames before running the computation.

```typescript
startTransition(() => {
  updateSettings({ activeStrategies: updated })
})
```

**Pros:**

- Simple to implement
- Minimal overhead
- Works great for 10-100ms computations

**Cons:**

- Main thread is still blocked, just after rendering
- Doesn't help if computation > 100ms

**Decision:** ✅ Use for backtests (9-20ms), already implemented

### Approach 3: Memoization ❌

Cache results to avoid recalculation.

```typescript
const results = useMemo(() => {
  // computation
}, [dependencies])
```

**Why it failed:** Memoization prevents _unnecessary_ recalculations when dependencies don't change. But when users _change_ parameters, the dependencies change, and memoization can't help. **It doesn't reduce blocking time, only prevents redundant work.**

**Decision:** ❌ Doesn't solve the blocking problem

## Implementation

### For Strategy Backtests: startTransition

Already implemented in ConfigPanel.tsx. Updates to interval, dates, and strategies use:

```typescript
const handleIntervalChange = (value: InvestmentInterval) => {
  setLocalInterval(value)
  startTransition(() => updateSettings({ interval: value }))
}
```

No additional work needed.

### For Sensitivity Analysis: Web Worker

Created `src/workers/sensitivity.worker.ts`:

```typescript
// Worker receives message with settings and priceData
self.addEventListener('message', (event: MessageEvent<SensitivityMessage>) => {
  const { config, priceData, startDate, endDate, param } = event.data
  const result = runSensitivityAnalysis(config, priceData, ...)
  self.postMessage({ success: true, data: result })
})
```

Updated `ReturnHeatmap.tsx` to use the worker:

```typescript
const [sensitivityData, setSensitivityData] = useState<any[]>([])

// Initialize worker once
useEffect(() => {
  workerRef.current = new Worker(
    new URL('@/workers/sensitivity.worker.ts', import.meta.url),
    { type: 'module' }
  )
  // Listen for results...
}, [])

// Send computation to worker when data changes
useEffect(() => {
  if (!priceData) return
  workerRef.current?.postMessage({ config, priceData, ... })
}, [priceData, settings])
```

## Results

### Before Optimization

- **Strategy backtests:** 9-20ms (already acceptable)
- **Sensitivity analysis:** 262ms (UI blocks completely)
- **User experience:** Noticeable freeze when changing dates/strategies

### After Optimization

- **Strategy backtests:** 9-20ms (unchanged, using startTransition)
- **Sensitivity analysis:** 167-171ms (36% faster, **non-blocking**)
- **User experience:** Smooth interactions, heatmap updates asynchronously

### Performance Comparison

| Operation       | Before                | After                    | Improvement        |
| --------------- | --------------------- | ------------------------ | ------------------ |
| Change date     | 262ms freeze          | 0ms freeze + async 170ms | ✅ 100% responsive |
| Change strategy | 262ms freeze          | 0ms freeze + async 170ms | ✅ 100% responsive |
| Change amount   | 9ms + startTransition | 9ms + startTransition    | ✅ No regression   |

## Key Learnings

1. **Measure first** — We identified the real bottleneck (sensitivity analysis) rather than assuming all backtests were slow.

2. **Right tool for the job** — Don't use Web Workers for 10ms tasks. Use startTransition instead. Web Workers shine for 200ms+ computations.

3. **Blocking vs scheduling** — There's a difference:
   - **Blocking problem:** Computation takes too long → use Web Workers
   - **Scheduling problem:** Computation happens at wrong time → use startTransition

4. **Memoization != Optimization** — Caching only helps when you can skip work. If work is always necessary, memoization won't reduce blocking time.

## Takeaways for Similar Projects

- Use `performance.mark()` and `performance.measure()` to identify real bottlenecks
- For computations < 100ms: use `startTransition` + synchronous code
- For computations > 200ms: use Web Workers
- For 100-200ms: benchmark both approaches, choose based on implementation cost
- Memoization is valuable, but only as a complement—not a replacement—for reducing computation time

## References

- [React startTransition Documentation](https://react.dev/reference/react/startTransition)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
