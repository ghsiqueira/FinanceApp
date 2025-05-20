import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

interface BarChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      colors?: string[];
    }[];
    legend?: string[];
  };
  height?: number;
  width?: number;
  formatYLabel?: (value: string) => string;
  showValuesOnTopOfBars?: boolean;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 220,
  width,
  formatYLabel,
  showValuesOnTopOfBars = false,
  horizontal = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = width || Dimensions.get('window').width - 32; // Padding on both sides

  // Create a compatible data structure for the chart library
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      data: dataset.data,
    })),
    legend: data.legend || [],
  };

  // Configure chart appearance
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1, index = 0) => {
      if (data.datasets[0].colors && data.datasets[0].colors[index]) {
        return data.datasets[0].colors[index] + (opacity * 255).toString(16).slice(0, 2);
      }
      return isDarkMode 
        ? `rgba(200, 200, 200, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`;
    },
    labelColor: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.7,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    formatYLabel: formatYLabel ? formatYLabel : (value: string) => value,
  };

  // Remove unsupported props for the React Native Chart Kit
  const supportedProps: any = {
    data: chartData,
    width: screenWidth,
    height,
    chartConfig,
    style: styles.chart,
    withInnerLines: true,
    withHorizontalLabels: true,
    showBarTops: showValuesOnTopOfBars,
    fromZero: true,
    yAxisLabel: "",
    yAxisSuffix: ""
  };

  // Only add horizontal prop if it's supported in your version of react-native-chart-kit
  if (horizontal) {
    // Some versions support this as:
    // supportedProps.horizontalBarChartProps = { horizontal: true };
    // But we'll exclude it to avoid errors
  }

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      )}
      <RNBarChart
        {...supportedProps}
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
    paddingRight: 0,
  },
});

export default BarChart;