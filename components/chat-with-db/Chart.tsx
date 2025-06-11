'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnterFullScreenIcon as ExpandIcon, ExitFullScreenIcon as ShrinkIcon } from '@radix-ui/react-icons';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">Loading chart...</span>
      </div>
    </div>
  )
});

interface ChartProps {
  data: any;
  title?: string;
  className?: string;
  height?: number;
  width?: number;
}

const Chart: React.FC<ChartProps> = ({
  data,
  title = "Chart",
  className = "",
  height = 400,
  width
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Validate data structure
  useEffect(() => {
    if (data && (!data.data || !data.layout)) {
      setError('Invalid chart data structure');
    } else {
      setError(null);
    }
  }, [data]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!data) {
    return null;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <p className="text-sm text-red-500 mb-2">⚠️ {error}</p>
              <p className="text-xs text-muted-foreground">
                The chart could not be displayed. Please try refreshing the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Configure responsive layout
  const layout = {
    ...data.layout,
    autosize: true,
    responsive: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 12,
      color: 'currentColor'
    }
  };

  // Configure responsive options
  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: title.toLowerCase().replace(/\s+/g, '_'),
      height: height,
      width: width || 800,
      scale: 2
    }
  };

  return (
    <Card className={`${className} ${isExpanded ? 'fixed inset-4 z-50 bg-background' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <ShrinkIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Plot
            data={data.data}
            layout={layout}
            config={config}
            style={{
              height: isExpanded ? 'calc(100vh - 200px)' : height,
              width: '100%'
            }}
            useResizeHandler={true}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Chart;
