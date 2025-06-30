// Performance monitoring utility for CartonScanner
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`Timer ${label} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(label);

    // Store metric for averaging
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Log performance data
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      if (times.length > 0) {
        result[label] = {
          average: this.getAverageTime(label),
          count: times.length,
          min: Math.min(...times),
          max: Math.max(...times)
        };
      }
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Specific performance tracking for carton scanning
  trackScanToDisplay(): void {
    this.startTimer('scan-to-display');
  }

  endScanToDisplay(): number {
    return this.endTimer('scan-to-display');
  }

  trackRenderTime(): void {
    this.startTimer('render-time');
  }

  endRenderTime(): number {
    return this.endTimer('render-time');
  }

  trackBarcodeLookup(): void {
    this.startTimer('barcode-lookup');
  }

  endBarcodeLookup(): number {
    return this.endTimer('barcode-lookup');
  }

  // Performance reporting
  reportPerformance(): void {
    const metrics = this.getMetrics();
    console.group('🚀 CartonScanner Performance Report');
    
    for (const [label, data] of Object.entries(metrics)) {
      console.log(`${label}:`);
      console.log(`  Average: ${data.average.toFixed(2)}ms`);
      console.log(`  Min: ${data.min.toFixed(2)}ms`);
      console.log(`  Max: ${data.max.toFixed(2)}ms`);
      console.log(`  Count: ${data.count}`);
    }
    
    console.groupEnd();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startTimer: monitor.startTimer.bind(monitor),
    endTimer: monitor.endTimer.bind(monitor),
    trackScanToDisplay: monitor.trackScanToDisplay.bind(monitor),
    endScanToDisplay: monitor.endScanToDisplay.bind(monitor),
    trackRenderTime: monitor.trackRenderTime.bind(monitor),
    endRenderTime: monitor.endRenderTime.bind(monitor),
    trackBarcodeLookup: monitor.trackBarcodeLookup.bind(monitor),
    endBarcodeLookup: monitor.endBarcodeLookup.bind(monitor),
    reportPerformance: monitor.reportPerformance.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor)
  };
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Batch DOM updates for better performance
  batchDOMUpdates(updates: (() => void)[]): void {
    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Optimize array operations
  createLookupMap<T, K extends keyof T>(
    array: T[],
    key: K
  ): Map<T[K], T> {
    const map = new Map();
    for (const item of array) {
      map.set(item[key], item);
    }
    return map;
  }
}; 