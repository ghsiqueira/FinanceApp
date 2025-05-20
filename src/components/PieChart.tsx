// src/components/PieChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

interface PieChartData {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface PieChartProps {
  title?: string;
  data: PieChartData[];
  height?: number;
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  center?: [number, number];
  absolute?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  height = 220,
  accessor = 'value',
  backgroundColor,
  paddingLeft = '0',
  center,
  absolute = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width - 32; // Padding on both sides

  // Adjust data to include default legendFontColor based on theme
  const chartData = data.map(item => ({
    ...item,
    legendFontColor: item.legendFontColor || theme.text,
    legendFontSize: item.legendFontSize || 12
  }));

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: backgroundColor || theme.card,
    backgroundGradientTo: backgroundColor || theme.card,
    color: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      )}
      <RNPieChart
        data={chartData}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        accessor={accessor}
        backgroundColor={backgroundColor || 'transparent'}
        paddingLeft={paddingLeft}
        center={center}
        absolute={absolute}
        style={styles.chart}
        hasLegend
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
});

export default PieChart;