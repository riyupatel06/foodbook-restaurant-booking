import { useEffect, useState } from "react";

function formatValue(value, { suffix = "", decimals = 0 }) {
  if (decimals > 0) {
    return `${value.toFixed(decimals)}${suffix}`;
  }

  return `${Math.round(value).toLocaleString()}${suffix}`;
}

export default function AnimatedCounter({
  end,
  suffix = "",
  decimals = 0,
  duration = 1200,
  className = "",
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const step = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [duration, end]);

  return <span className={className}>{formatValue(value, { suffix, decimals })}</span>;
}
