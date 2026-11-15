<template>
  <div class="mx-auto d-flex justify-center align-center pa-4" style="min-height: 90vh;">
    <v-card width="100%" max-width="440" class="pa-4 rounded-lg" elevation="2">
      <v-card-title class="text-h6 font-weight-bold text-center">
        QR Code Scanner
      </v-card-title>

      <v-card-text>
        <!-- Error Alert -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-3"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <!-- Video Preview -->
        <video ref="videoRef" class="qr-video"></video>

        <!-- Scanned Result Display -->
        <v-alert
          v-if="scannedResult"
          type="success"
          variant="tonal"
          class="mt-3"
        >
          <div class="text-caption font-weight-bold">Scanned Result:</div>
          <div class="text-body-2 text-break mt-1">
            <a
              v-if="isUrl(scannedResult)"
              :href="scannedResult"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary font-weight-medium"
            >
              {{ scannedResult }}
            </a>
            <span v-else>{{ scannedResult }}</span>
          </div>
        </v-alert>

        <!-- Controls -->
        <v-btn
          block
          color="green"
          class="mt-4 text-none"
          :disabled="isScanning"
          @click="startScanner"
        >
          Start Scanner
        </v-btn>

        <v-btn
          block
          color="red"
          class="mt-2 text-none"
          :disabled="!isScanning"
          @click="stopScanner"
        >
          Stop Scanner
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
//@ts-nocheck
import { ref, onBeforeUnmount } from 'vue'
import QrScanner from 'qr-scanner'

const videoRef = ref<HTMLVideoElement | null>(null)
const scannedResult = ref('')
const errorMessage = ref('')
const isScanning = ref(false)
let scanner: QrScanner | null = null

const isUrl = (text: string) => {
  return /^https?:\/\//i.test(text)
}

const startScanner = async () => {
  if (!videoRef.value) return
  errorMessage.value = ''
  scannedResult.value = ''

  try {
    if (!scanner) {
      scanner = new QrScanner(
        videoRef.value,
        (scanResult) => {
          scannedResult.value = scanResult.data
          stopScanner()
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )
    }

    await scanner.start()
    isScanning.value = true
  } catch (err: any) {
    console.error('QR Scanner error:', err)
    errorMessage.value =
      err?.message || 'Unable to access camera. Please allow camera permissions in your browser.'
    isScanning.value = false
  }
}

const stopScanner = () => {
  if (scanner) {
    scanner.stop()
  }
  isScanning.value = false
}

onBeforeUnmount(() => {
  if (scanner) {
    scanner.destroy()
    scanner = null
  }
})
</script>

<style scoped>
.qr-video {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
  background: #111;
  display: block;
}
</style>
