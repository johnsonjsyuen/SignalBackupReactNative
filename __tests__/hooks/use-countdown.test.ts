import { renderHook, act } from '@testing-library/react-native';
import { useCountdown } from '@/hooks/use-countdown';

// ---------------------------------------------------------------------------
// We rely on fake timers so we can control Date.now() and setInterval.
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  // Pin "now" to 2025-06-15 10:00:00 local time.
  jest.setSystemTime(new Date(2025, 5, 15, 10, 0, 0, 0));
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCountdown', () => {
  it('returns a formatted countdown string for a future schedule today', () => {
    // Schedule at 15:30 -- 5h 30m from "now" (10:00).
    const { result } = renderHook(() => useCountdown(15, 30));

    expect(result.current).toBe('5h 30m');
  });

  it('targets tomorrow when the schedule time has already passed today', () => {
    // Schedule at 08:00 -- already past 10:00, so target is tomorrow 08:00
    // = 22 hours from now => "22h 00m"
    const { result } = renderHook(() => useCountdown(8, 0));

    expect(result.current).toBe('22h 00m');
  });

  it('updates the display when scheduleHour or scheduleMinute change', () => {
    const { result, rerender } = renderHook(
      ({ hour, minute }: { hour: number; minute: number }) =>
        useCountdown(hour, minute),
      { initialProps: { hour: 15, minute: 30 } },
    );

    expect(result.current).toBe('5h 30m');

    // Move schedule to 12:00 -- 2h from now.
    rerender({ hour: 12, minute: 0 });

    expect(result.current).toBe('2h 00m');
  });

  it('sets up a 60-second interval that refreshes the display', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    renderHook(() => useCountdown(15, 0));

    // Verify setInterval was called with 60_000ms.
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);

    setIntervalSpy.mockRestore();
  });

  it('cleans up the interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useCountdown(15, 0));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('recalculates the display when the interval fires', () => {
    const { result } = renderHook(() => useCountdown(15, 0));

    // Initially 5h 00m from 10:00 to 15:00.
    expect(result.current).toBe('5h 00m');

    // Advance system clock by 1 hour. Then advance timers so the interval
    // fires.  advanceTimersByTime also moves Date.now() forward by the same
    // amount, so after the interval fires Date.now() will be 11:01:00.
    // 15:00 - 11:01 = 3h 59m.
    act(() => {
      jest.setSystemTime(new Date(2025, 5, 15, 11, 0, 0, 0));
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('3h 59m');
  });
});
