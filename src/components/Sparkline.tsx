interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline = ({ data, width = 80, height = 24, className = "" }: SparklineProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
