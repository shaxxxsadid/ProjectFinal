'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

// ── Утилита для чтения CSS-переменных ──────────────────────────────────────
const getCSSVar = (name: string): string => {
  if (typeof window === 'undefined') return '#ffffff';
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  if (value === 'black') return '#000000';
  if (value === 'white') return '#ffffff';

  return value || '#ffffff';
};

// ─── Интерфейс 1: Столбчатая диаграмма ──────────────────────────────────────
interface WarehouseChartProps {
  data: Array<{ warehouse: string; quantity: number; reserved: number }>;
}

export function WarehouseStockChart({ data }: WarehouseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !data?.length) return;

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        paddingBottom: 60,
        paddingRight: 20,
        paddingLeft: 0,
        paddingTop: 20,
      })
    );

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'warehouse',
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
        }),
      })
    );

    xAxis.get('renderer').labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      fontSize: 11,
      paddingTop: 10,
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueYField: 'quantity',
        categoryXField: 'warehouse',
        tooltip: am5.Tooltip.new(root, {
          labelText: '{categoryX}: {valueY}',
          background: am5.Rectangle.new(root, {
            fill: am5.color(theme === 'dark' ? '#1f2937' : '#ffffff'),
            stroke: am5.color(theme === 'dark' ? '#374151' : '#e5e7eb'),
            strokeWidth: 1,
          }),
        }),
      })
    );

    // 🔺 ИЗМЕНЕНИЕ 1: увеличена высота колонок (80% → 95%)
    series.columns.template.setAll({
      fill: am5.color(theme === 'dark' ? '#00b7b7' : '#8b4513'),
      strokeOpacity: 0,
      cornerRadiusTR: 6,
      cornerRadiusTL: 6,
      height: am5.percent(95), // ← было 80%
      width: am5.percent(80),
    });

    xAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, theme]);

  return <div ref={chartRef} className="w-full h-87.5" />;
}

interface DistributionChartProps {
  data: Array<{ status: string; value: number }>;
}

export function StockDistributionChart({ data }: DistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !data?.length) return;

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(45),
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'status',
        alignLabels: false,
      })
    );

    const isDark = theme === 'dark';
    const color1 = am5.color(isDark ? '#00b7b7' : '#8b4513');
    const color2 = am5.color(isDark ? '#4a4a4a' : '#d4c4b7');

    series.set("colors", am5.ColorSet.new(root, {
      colors: [color1, color2]
    }));

    // 🔺 ИЗМЕНЕНИЕ 2: убрана обводка у сегментов donut-диаграммы
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(getCSSVar('--background')),
      strokeOpacity: 0, // ← добавлено: скрывает обводку
    });

    series.data.setAll(data);

    return () => root.dispose();
  }, [data, theme]);

  return <div ref={chartRef} className="w-full h-75" />;
}