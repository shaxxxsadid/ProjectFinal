"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

type PieData = { status: string; value: number }[];

export default function StokeDistributionChart({ data }: { data: PieData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || data.length === 0) return;

    const isDark = resolvedTheme === "dark";
    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const availableColor = am5.color(isDark ? 0x10b981 : 0x059669);
    const reservedColor = am5.color(isDark ? 0xf59e0b : 0xd97706);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, { 
        layout: root.verticalLayout,
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "status",
        alignLabels: true, // ✅ Выравниваем лейблы
        radius: am5.percent(70), // ✅ УВЕЛИЧИЛИ радиус (было 50)
        innerRadius: am5.percent(50), // ✅ УВЕЛИЧИЛИ внутренний радиус (было 40)
      })
    );

    // ✅ УБИРАЕМ ОБВОДКУ
    series.slices.template.setAll({
      stroke: am5.color(0x000000),
      strokeWidth: 0,
      strokeOpacity: 0,
      cornerRadius: 0,
      toggleKey: "active",
      cursorOverStyle: "pointer"
    });

    // ✅ Цвета через dataContext
    series.slices.template.adapters.add("fill", (fill, target) => {
      const dataContext = target.dataItem?.dataContext as { status?: string } | undefined;
      const status = dataContext?.status;
      if (status === "Свободно") return availableColor;
      if (status === "Занято") return reservedColor;
      return fill;
    });

    // ✅ ИСПРАВЛЕННЫЕ ЛЕЙБЛЫ с правильным форматом
    series.labels.template.setAll({
      fontSize: 14, // ✅ Увеличили шрифт
      fill: am5.color(isDark ? 0xe4e4e7 : 0x27272a),
      background: am5.RoundedRectangle.new(root, {
        fill: am5.color(isDark ? 0x27272a : 0xe4e4e7),
        fillOpacity: 0.9, // ✅ Более непрозрачный фон
        cornerRadiusTL: 6,
        cornerRadiusTR: 6,
        cornerRadiusBL: 6,
        cornerRadiusBR: 6
      }),
      paddingLeft: 10,
      paddingRight: 10,
      paddingTop: 6,
      paddingBottom: 6,
      centerX: am5.p50,
      textAlign: "center"
    });

    // ✅ Устанавливаем данные
    series.data.setAll(data);
    
    // ✅ Принудительно пересчитываем проценты для каждого элемента
    const total = data.reduce((sum, item) => sum + item.value, 0);
    series.dataItems.forEach((dataItem) => {
      const value = dataItem.get("value") || 0;
      const percent = total > 0 ? (value / total) * 100 : 0;
      dataItem.set("percent", percent);
    });

    series.appear(1000, 100);

    return () => root.dispose();
  }, [data, resolvedTheme]);

  return (
    <div className="rounded-xl p-6 shadow-sm border bg-card border-border text-card-foreground">
      <h3 className="text-lg font-semibold mb-4">Распределение мест</h3>
      <div ref={chartRef} className="w-full h-125" />
    </div>
  );
}