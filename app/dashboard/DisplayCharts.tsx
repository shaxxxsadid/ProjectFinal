'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const getCSSVar = (
  name: string,
  fallback: string
): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim() || fallback
  );
};

// ─────────────────────────────────────────────────────────────
// Остатки по складам
// ─────────────────────────────────────────────────────────────
interface WarehouseChartProps {
  data: Array<{
    warehouse: string;
    quantity: number;
    available: number;
    reserved: number;
  }>;
}

export function WarehouseStockChart({
  data,
}: WarehouseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !data?.length) {
      return;
    }

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const foreground = getCSSVar(
      '--foreground',
      resolvedTheme === 'dark'
        ? '#ffffff'
        : '#000000'
    );

    const background = getCSSVar(
      '--background',
      resolvedTheme === 'dark'
        ? '#000000'
        : '#ffffff'
    );

    const accent = getCSSVar(
      '--box',
      resolvedTheme === 'dark'
        ? '#00b7b7'
        : '#8b4513'
    );

    const textColor = am5.color(foreground);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingTop: 8,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 6,
      })
    );

    const xRenderer = am5xy.AxisRendererX.new(
      root,
      {
        minGridDistance: 55,
        cellStartLocation: 0.12,
        cellEndLocation: 0.88,
      }
    );

    xRenderer.labels.template.setAll({
      fill: textColor,
      fillOpacity: 0.72,
      fontSize: 10,
      maxWidth: 135,
      oversizedBehavior: 'truncate',
      centerX: am5.p50,
      textAlign: 'center',
      paddingTop: 8,
    });

    xRenderer.grid.template.setAll({
      strokeOpacity: 0,
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'warehouse',
        renderer: xRenderer,
      })
    );

    const yRenderer =
      am5xy.AxisRendererY.new(root, {});

    yRenderer.labels.template.setAll({
      fill: textColor,
      fillOpacity: 0.45,
      fontSize: 10,
      paddingRight: 6,
    });

    yRenderer.grid.template.setAll({
      stroke: textColor,
      strokeOpacity: 0.09,
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        extraMax: 0.08,
        renderer: yRenderer,
      })
    );

    const createSeries = (
      name: string,
      field: 'available' | 'reserved',
      color: string,
      opacity: number
    ) => {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name,
          xAxis,
          yAxis,
          valueYField: field,
          categoryXField: 'warehouse',
          clustered: true,
          tooltip: am5.Tooltip.new(root, {
            labelText:
              '[bold]{categoryX}[/]\n{name}: {valueY.formatNumber("#,###")}',
            background:
              am5.RoundedRectangle.new(root, {
                fill: am5.color(background),
                fillOpacity: 0.97,
                stroke: am5.color(color),
                strokeOpacity: 0.35,
                cornerRadiusTL: 8,
                cornerRadiusTR: 8,
                cornerRadiusBL: 8,
                cornerRadiusBR: 8,
              }),
          }),
        })
      );

      series.columns.template.setAll({
        fill: am5.color(color),
        fillOpacity: opacity,
        strokeOpacity: 0,
        width: am5.percent(72),
        cornerRadiusTL: 6,
        cornerRadiusTR: 6,
      });

      series.data.setAll(data);
      series.appear(650);

      return series;
    };

    createSeries(
      'Свободно',
      'available',
      accent,
      1
    );

    createSeries(
      'Зарезервировано',
      'reserved',
      foreground,
      0.28
    );

    xAxis.data.setAll(data);

    const cursor = chart.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        behavior: 'none',
      })
    );

    cursor.lineX.setAll({
      stroke: textColor,
      strokeOpacity: 0.16,
    });

    cursor.lineY.set('visible', false);

    chart.appear(650, 60);

    return () => root.dispose();
  }, [data, resolvedTheme]);

  if (!data?.length) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        Нет данных по складам
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="h-60 w-full"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Распределение запасов
// ВАЖНО: никаких внешних amCharts labels/ticks/tooltips.
// Легенда выводится wrapper-компонентом на React.
// ─────────────────────────────────────────────────────────────
interface DistributionChartProps {
  data: Array<{
    status: string;
    value: number;
  }>;
}

export function StockDistributionChart({
  data,
}: DistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || !data?.length) {
      return;
    }

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const foreground = getCSSVar(
      '--foreground',
      resolvedTheme === 'dark'
        ? '#ffffff'
        : '#000000'
    );

    const accent = getCSSVar(
      '--box',
      resolvedTheme === 'dark'
        ? '#00b7b7'
        : '#8b4513'
    );

    const chart =
      root.container.children.push(
        am5percent.PieChart.new(root, {
          innerRadius: am5.percent(68),
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
        })
      );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'status',
        alignLabels: false,
      })
    );

    series.set(
      'colors',
      am5.ColorSet.new(root, {
        colors: [
          am5.color(accent),
          am5.color(foreground),
        ],
        reuse: true,
      })
    );

    // Никаких всплывающих tooltip за границами блока.
    series.slices.template.setAll({
      strokeOpacity: 0,
      cornerRadius: 5,
      tooltipText: '',
      interactive: false,
    });

    // Жёстко убираем стандартные внешние подписи amCharts.
    // text: '' дополнительно защищает от их появления после resize/animation.
    series.labels.template.setAll({
      text: '',
      visible: false,
      forceHidden: true,
      opacity: 0,
    });

    series.labels.template.adapters.add(
      'text',
      () => ''
    );

    series.ticks.template.setAll({
      visible: false,
      forceHidden: true,
      opacity: 0,
      strokeOpacity: 0,
    });

    series.data.setAll(data);

    series.appear(650, 60);

    return () => root.dispose();
  }, [data, resolvedTheme]);

  if (!data?.length) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        Нет данных о запасах
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="h-44 w-full"
    />
  );
}
