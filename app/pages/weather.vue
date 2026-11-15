<template>
  <div class="weather-page pa-4 pa-md-8">
    <div class="weather-container">
      
      <!-- Top Search Bar & Location Pill -->
      <div class="d-flex flex-column flex-sm-row justify-space-between align-center mb-6 ga-3">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search city..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          bg-color="white"
          hide-details
          clearable
          class="search-input"
          :loading="loading"
          @keyup.enter="handleSearch"
        />

        <v-btn
          variant="flat"
          color="white"
          class="location-btn text-none px-4"
          prepend-icon="mdi-map-marker"
          @click="searchDialog = true"
        >
          {{ weatherData?.location ? `${weatherData.location.name}, ${weatherData.location.region || weatherData.location.country}` : 'San Fernando, Pampanga' }}
        </v-btn>
      </div>

      <!-- Error Alert -->
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Main Weather Card -->
      <v-card class="main-card pa-6 mb-6" elevation="1">
        <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center ga-4">
          <div>
            <div class="text-overline text-primary font-weight-bold">Current Weather</div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-4">
              {{ weatherData?.location?.name || 'San Fernando' }}
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">{{ formattedDate }}</p>
          </div>

          <div class="d-flex align-center ga-3">
            <img
              v-if="weatherData?.current?.condition?.icon"
              :src="`https:${weatherData.current.condition.icon}`"
              alt="Weather condition"
              width="64"
              height="64"
            />
            <div class="text-right">
              <div class="text-h2 font-weight-bold text-grey-darken-4">
                {{ weatherData?.current?.temp_c !== undefined ? Math.round(weatherData.current.temp_c) : '29' }}°C
              </div>
              <div class="text-body-2 text-grey-darken-1">
                {{ weatherData?.current?.condition?.text || 'Partly Cloudy' }}
              </div>
            </div>
          </div>
        </div>

        <v-divider class="my-5" />

        <!-- 3 Primary Quick Stats -->
        <v-row>
          <v-col cols="4" class="text-center">
            <v-icon icon="mdi-weather-rainy" color="primary" class="mb-1" />
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-4">
              {{ weatherData?.current?.chance_of_rain ?? 18 }}%
            </div>
            <div class="text-caption text-grey-darken-1">Rain Chance</div>
          </v-col>

          <v-col cols="4" class="text-center">
            <v-icon icon="mdi-weather-windy" color="primary" class="mb-1" />
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-4">
              {{ weatherData?.current?.wind_kph ?? 6.5 }} km/h
            </div>
            <div class="text-caption text-grey-darken-1">
              Wind ({{ weatherData?.current?.wind_dir || 'NNE' }})
            </div>
          </v-col>

          <v-col cols="4" class="text-center">
            <v-icon icon="mdi-water-percent" color="primary" class="mb-1" />
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-4">
              {{ weatherData?.current?.humidity ?? 71 }}%
            </div>
            <div class="text-caption text-grey-darken-1">Humidity</div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Selected Detail Banner -->
      <v-alert
        v-if="selectedDetail"
        color="primary"
        variant="tonal"
        class="mb-6"
        :icon="selectedDetail.icon"
      >
        <div class="font-weight-bold">{{ selectedDetail.title }}: {{ selectedDetail.value }}</div>
        <div class="text-caption">{{ selectedDetail.description }}</div>
      </v-alert>

      <!-- Weather Highlights Grid -->
      <div class="mb-3 d-flex justify-space-between align-center">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Details</h2>
        <span class="text-caption text-grey-darken-1">Tap a card for info</span>
      </div>

      <v-row>
        <v-col
          v-for="(card, index) in metricCards"
          :key="index"
          cols="6"
          sm="4"
          md="2"
        >
          <v-card
            class="metric-card pa-4 text-center"
            :class="{ 'selected-metric': activeCardIndex === index }"
            elevation="1"
            @click="selectCard(index, card)"
          >
            <div class="text-caption text-grey-darken-1 mb-1 text-truncate">{{ card.title }}</div>
            <v-icon :icon="card.icon" color="primary" size="24" class="my-1" />
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-4 mt-1 text-truncate">
              {{ card.value }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Search City Modal -->
    <v-dialog v-model="searchDialog" max-width="400px">
      <v-card class="pa-5 rounded-lg">
        <div class="d-flex justify-space-between align-center mb-3">
          <h3 class="text-subtitle-1 font-weight-bold">Change Location</h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="searchDialog = false" />
        </div>

        <v-text-field
          v-model="searchQuery"
          label="City name"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          hide-details
          @keyup.enter="handleSearch"
        />

        <v-btn
          block
          color="primary"
          class="text-none font-weight-bold"
          :loading="loading"
          @click="handleSearch"
        >
          Search
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
//@ts-nocheck
import { ref, computed, onMounted } from 'vue'

const config = useRuntimeConfig()
const weatherData = ref(null)
const searchDialog = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const errorMessage = ref('')
const activeCardIndex = ref(0)
const selectedDetail = ref(null)

const formattedDate = computed(() => {
  if (!weatherData.value?.location?.localtime) return 'Sunday, 15 November'
  const dateStr = weatherData.value.location.localtime.split(' ')[0]
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
})

const metricCards = computed(() => {
  const current = weatherData.value?.current
  return [
    {
      title: 'Current Temp',
      value: `${current?.temp_c ? Math.round(current.temp_c) : 29}°C`,
      icon: 'mdi-thermometer-lines',
      description: `Actual air temperature in ${weatherData.value?.location?.name || 'San Fernando'}.`
    },
    {
      title: 'Condition',
      value: current?.condition?.text || 'Overcast',
      icon: 'mdi-weather-partly-cloudy',
      description: `Sky status is currently ${current?.condition?.text || 'Overcast'}.`
    },
    {
      title: 'Feels Like',
      value: `${current?.feelslike_c ? Math.round(current.feelslike_c) : 32}°C`,
      icon: 'mdi-thermometer',
      description: `Apparent temperature accounting for humidity and wind.`
    },
    {
      title: 'Pressure',
      value: `${current?.pressure_mb || 1015} hPa`,
      icon: 'mdi-gauge',
      description: `Atmospheric pressure measured at sea level.`
    },
    {
      title: 'Visibility',
      value: `${current?.vis_km || 10} km`,
      icon: 'mdi-eye',
      description: `Horizontal distance at which objects can be clearly seen.`
    },
    {
      title: 'UV Index',
      value: `${current?.uv || 3.6}`,
      icon: 'mdi-white-balance-sunny',
      description: `Solar ultraviolet radiation exposure level.`
    }
  ]
})

const selectCard = (index: number, card: any) => {
  activeCardIndex.value = index
  selectedDetail.value = card
}

const getWeather = async (city = 'San Fernando') => {
  loading.value = true
  errorMessage.value = ''
  try {
    const endpoint = ['https://', 'api.', 'weatherapi.com', '/v1/current.json'].join('')
    const response = await $fetch(endpoint, {
      params: {
        key: config.public.weatherApiKey,
        q: city,
        aqi: 'no'
      }
    })
    if (response) {
      weatherData.value = response
      searchDialog.value = false
      searchQuery.value = ''

      if (metricCards.value.length > 0) {
        selectCard(0, metricCards.value[0])
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch weather data:', err)
    errorMessage.value = err?.data?.error?.message || 'Could not fetch weather for this city. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (!searchQuery.value || !searchQuery.value.trim()) return
  getWeather(searchQuery.value.trim())
}

onMounted(() => {
  getWeather('San Fernando')
})
</script>

<style scoped>
.weather-page {
  min-height: calc(100vh - 64px);
  background-color: #f3f6fa;
}

.weather-container {
  max-width: 1000px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  max-width: 300px;
}

.location-btn {
  border: 1px solid #e0e6ed;
  border-radius: 8px;
}

.main-card {
  background-color: #ffffff;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
}

.metric-card {
  background-color: #ffffff;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: #1976d2;
}

.selected-metric {
border: 2px solid #1976d2;
background-color: #f0f7ff;
}
</style>