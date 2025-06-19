<template>
  <div class="relative">
    <canvas :id="chartId" :width="width" :height="height"></canvas>
    
    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
    >
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-sm text-gray-600">Loading chart...</span>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="absolute inset-0 bg-red-50 flex items-center justify-center rounded-lg"
    >
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-red-800">Chart Error</h3>
        <p class="mt-1 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartConfiguration,
  type ChartType,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface ChartProps {
  type: ChartType;
  data: any;
  options?: any;
  width?: number;
  height?: number;
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<ChartProps>(), {
  width: 400,
  height: 200,
  loading: false,
});

const emit = defineEmits<{
  'chart-created': [chart: Chart];
  'chart-destroyed': [];
}>();

const chartId = ref(`chart-${Math.random().toString(36).substr(2, 9)}`);
const chartInstance = ref<Chart | null>(null);

const createChart = async () => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  await nextTick();

  const canvas = document.getElementById(chartId.value) as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    const config: ChartConfiguration = {
      type: props.type,
      data: props.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: props.type !== 'pie' && props.type !== 'doughnut' ? {
          x: {
            display: true,
            title: {
              display: false,
            },
          },
          y: {
            display: true,
            title: {
              display: false,
            },
          },
        } : undefined,
        ...props.options,
      },
    };

    chartInstance.value = new Chart(ctx, config);
    emit('chart-created', chartInstance.value);
  } catch (error) {
    console.error('Error creating chart:', error);
  }
};

const destroyChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
    emit('chart-destroyed');
  }
};

const updateChart = () => {
  if (chartInstance.value && props.data) {
    chartInstance.value.data = props.data;
    if (props.options) {
      chartInstance.value.options = { ...chartInstance.value.options, ...props.options };
    }
    chartInstance.value.update();
  }
};

// Watch for data changes
watch(() => props.data, () => {
  if (chartInstance.value) {
    updateChart();
  }
}, { deep: true });

// Watch for options changes
watch(() => props.options, () => {
  if (chartInstance.value) {
    updateChart();
  }
}, { deep: true });

// Watch for type changes
watch(() => props.type, () => {
  createChart();
});

onMounted(() => {
  if (!props.loading && !props.error) {
    createChart();
  }
});

onUnmounted(() => {
  destroyChart();
});

// Watch loading state
watch(() => props.loading, (isLoading) => {
  if (!isLoading && !props.error && props.data) {
    createChart();
  }
});

// Expose chart instance for parent component
defineExpose({
  chart: chartInstance,
  updateChart,
  destroyChart,
});
</script>