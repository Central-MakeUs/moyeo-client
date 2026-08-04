import * as React from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timerId = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timerId);
  }, [delay, value]);

  return debouncedValue;
}
