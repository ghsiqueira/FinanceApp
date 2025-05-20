import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface PieChartProps {
  title?: string;
  data: PieChartDataItem[];
  height?: number;
  width?: number;
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  absolute?: boolean;
  hasLegend?: boolean;
  centerText?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  height = 220,
  width,
  accessor = 'value',
  backgroundColor,
  paddingLeft = '20',
  absolute = true,
  hasLegend = true,
  centerText,
}) => {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = width || Dimensions.get('window').width - 32; // Padding on both sides

  // Process data to add default legend font color
  const chartData = data.map(item => ({
    ...item,
    legendFontColor: item.legendFontColor || theme.text,
    legendFontSize: item.legendFontSize || 12,
  }));

  // Configure chart appearance
  const chartConfig = {
    backgroundColor: backgroundColor || theme.card,
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
  };

  // Remove unsupported props for the React Native Chart Kit
  const supportedProps: any = {
    data: chartData,
    width: screenWidth,
    height,
    chartConfig,
    accessor,
    backgroundColor: backgroundColor || 'transparent',
    paddingLeft,
    absolute,
    hasLegend,
    center: centerText ? [screenWidth / 2, height / 2] : undefined,
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      )}
      <RNPieChart
        {...supportedProps}
      />
      {centerText && (
        <View style={[styles.centerTextContainer, { top: height / 2 - 15, left: screenWidth / 2 - 45 }]}>
          <Text style={[styles.centerText, { color: theme.text }]}>
            {centerText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  centerTextContainer: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 30,
  },
  centerText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PieChart;