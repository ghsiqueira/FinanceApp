import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

interface LineChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: ((opacity: number) => string) | string;
      strokeWidth?: number;
    }[];
    legend?: string[];
  };
  height?: number;
  width?: number;
  formatYLabel?: (value: string) => string;
  bezier?: boolean;
  withDots?: boolean;
  withShadow?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  height = 220,
  width,
  formatYLabel,
  bezier = true,
  withDots = true,
  withShadow = true,
}) => {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = width || Dimensions.get('window').width - 32; // Padding on both sides

  // Configure chart appearance
  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    formatYLabel: formatYLabel ? formatYLabel : (value: string) => value,
  };

  // Remove unsupported props for the React Native Chart Kit
  const supportedProps: any = {
    data: data,
    width: screenWidth,
    height,
    chartConfig,
    style: styles.chart,
    withInnerLines: true,
    withOuterLines: true,
    withHorizontalLabels: true,
    withVerticalLabels: true,
    withDots,
    withShadow,
    bezier,
    fromZero: true,
    yAxisLabel: "",
    yAxisSuffix: ""
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      )}
      <RNLineChart
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

export default LineChart;