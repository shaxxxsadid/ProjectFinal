"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

type ChartData = { warehouse: string; quantity: number; reserved: number; available: number }[];

export default function WarehouseChart({ data }: { data: ChartData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || data.length === 0) return;

    const isDark = resolvedTheme === "dark";
    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const gridColor = isDark ? am5.color(0x27272a) : am5.color(0xe4e4e7);
    const labelColor = isDark ? am5.color(0xe4e4e7) : am5.color(0x27272a);
    const availableColor = am5.color(isDark ? 0x10b981 : 0x059669);
    const reservedColor = am5.color(isDark ? 0xf59e0b : 0xd97706);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, { panX: false, panY: false, layout: root.verticalLayout })
    );

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "warehouse",
        renderer: am5xy.AxisRendererX.new(root, { cellStartLocation: 0.1, cellEndLocation: 0.9 })
      })
    );
    
    xAxis.get("renderer")?.labels.template.setAll({ fill: labelColor });
    xAxis.get("renderer")?.grid.template.setAll({ stroke: gridColor, strokeOpacity: 0.3 });
    xAxis.data.setAll(data);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}), min: 0 })
    );
    yAxis.get("renderer")?.labels.template.setAll({ fill: labelColor });
    yAxis.get("renderer")?.grid.template.setAll({ stroke: gridColor, strokeOpacity: 0.3 });

    const makeSeries = (field: "available" | "reserved", name: string, color: am5.Color) => {
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, { name, xAxis, yAxis, valueYField: field, categoryXField: "warehouse" })
      );
      
      // ✅ ОБВОДКА ПОЛНОСТЬЮ УБРАНА
      series.columns.template.setAll({
        fill: color,
        strokeWidth: 0,
        strokeOpacity: 0,      // Гарантирует отсутствие границ при рендеринге
        tooltipText: "{name}: {valueY}",
        cornerRadiusTL: 6,
        cornerRadiusTR: 6
      });
      
      series.data.setAll(data);
      series.appear(800);
    };

    makeSeries("available", "Свободно", availableColor);
    makeSeries("reserved", "Занято", reservedColor);

    const legend = chart.children.push(am5.Legend.new(root, { centerX: am5.p50, x: am5.p50 }));
    legend.labels.template.setAll({ fill: labelColor });
    legend.data.setAll(chart.series.values);

    return () => root.dispose();
  }, [data, resolvedTheme]);

  return (
    <div className="rounded-xl p-4 shadow-sm border bg-card border-border text-card-foreground">
      <h3 className="text-lg font-semibold mb-2">Места на складах</h3>
      <div ref={chartRef} className="w-full h-96" />
    </div>
  );
}