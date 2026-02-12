import { useState, useEffect } from "react";

export function ImageProgress({ loading }: { loading: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        // 前期快,后期慢
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.3;
        return Math.min(prev + increment, 95);
      });
    }, 500);
    return () => clearInterval(timer);
  }, [loading]);

  return (
    <span className="text-2xl font-light text-[#8090b8] tracking-wide">
      {Math.round(progress)}%
    </span>
  );
}
