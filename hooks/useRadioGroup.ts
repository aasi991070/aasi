"use client";

import { useCallback, useState } from "react";

type UseRadioGroupOptions<T> = {
  items: readonly T[];
  value?: T;
  onChange?: (value: T) => void;
  getKey: (item: T) => string;
  isDisabled?: (item: T) => boolean;
  ariaLabel: string;
};

export function useRadioGroup<T>({
  items,
  value,
  onChange,
  getKey,
  isDisabled = () => false,
  ariaLabel,
}: UseRadioGroupOptions<T>) {
  const selectedIndex = value
    ? items.findIndex((item) => getKey(item) === getKey(value))
    : -1;

  const [focusIndex, setFocusIndex] = useState(() =>
    selectedIndex >= 0 ? selectedIndex : 0
  );

  const findNextEnabled = useCallback(
    (start: number, direction: 1 | -1) => {
      const length = items.length;
      for (let step = 1; step <= length; step += 1) {
        const index = (start + direction * step + length) % length;
        if (!isDisabled(items[index])) return index;
      }
      return start;
    },
    [isDisabled, items]
  );

  const selectIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || isDisabled(item)) return;
      setFocusIndex(index);
      onChange?.(item);
    },
    [isDisabled, items, onChange]
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (items.length === 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        selectIndex(findNextEnabled(focusIndex, 1));
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        selectIndex(findNextEnabled(focusIndex, -1));
        break;
      case "Home":
        event.preventDefault();
        selectIndex(items.findIndex((item) => !isDisabled(item)));
        break;
      case "End": {
        event.preventDefault();
        const lastEnabled = [...items]
          .reverse()
          .findIndex((item) => !isDisabled(item));
        if (lastEnabled >= 0) {
          selectIndex(items.length - 1 - lastEnabled);
        }
        break;
      }
      default:
        break;
    }
  };

  const getItemProps = (index: number, item: T) => {
    const disabled = isDisabled(item);
    const checked = value !== undefined && getKey(value) === getKey(item);

    return {
      role: "radio" as const,
      "aria-checked": checked,
      ...(disabled ? { "aria-disabled": true as const } : {}),
      tabIndex: focusIndex === index ? 0 : -1,
      onFocus: () => setFocusIndex(index),
      onClick: () => {
        if (!disabled) selectIndex(index);
      },
    };
  };

  return {
    radiogroupProps: {
      role: "radiogroup" as const,
      "aria-label": ariaLabel,
      onKeyDown: handleKeyDown,
    },
    getItemProps,
  };
}
