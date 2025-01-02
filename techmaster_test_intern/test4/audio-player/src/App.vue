<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Main Card -->
      <Card class="mb-8">
        <template #title>
          <div class="flex items-center gap-2 mb-4">
            <i class="pi pi-comments text-xl text-primary"></i>
            <span class="text-lg font-semibold">Hội thoại tiếng Việt</span>
          </div>
        </template>
        <template #content>
          <!-- Conversation -->
          <div class="space-y-4 mb-8">
            <div 
              v-for="(line, index) in subtitles" 
              :key="index"
              class="flex items-start gap-3 p-3 rounded-lg transition-all"
              :class="line.speaker === 'A' ? 'bg-blue-50' : 'bg-pink-50'"
            >
              <!-- Avatar -->
              <Avatar 
                :icon="line.speaker === 'A' ? 'pi pi-user' : 'pi pi-users'"
                :class="line.speaker === 'A' ? 'bg-primary' : 'bg-secondary'"
                shape="circle"
              />
              
              <!-- Text Content -->
              <div class="flex-1">
                <Badge 
                  :value="line.speaker === 'A' ? 'Lan' : 'James'"
                  :severity="line.speaker === 'A' ? 'info' : 'warning'"
                  class="mb-2"
                />
                <p 
                  class="text-lg leading-relaxed"
                  :class="line.speaker === 'A' ? 'text-blue-800' : 'text-pink-800'"
                >
                  <span v-html="getHighlightedText(line.text, index)"></span>
                </p>
              </div>
            </div>
          </div>

          <!-- Audio Controls -->
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <!-- Play/Stop Button -->
            <div class="flex items-center gap-4 mb-4">
              <Button 
                @click="togglePlay"
                :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
                :severity="isPlaying ? 'danger' : 'primary'"
                rounded
                raised
              />
              <span class="text-sm text-gray-600">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </span>
            </div>

            <!-- Progress Slider -->
            <Slider
              v-model="currentTime"
              :min="0"
              :max="duration"
              @change="onSliderChange"
              class="w-full"
            />

            <!-- Hidden Audio -->
            <audio 
              ref="audioPlayer" 
              @timeupdate="onTimeUpdate"
              @loadedmetadata="onLoadedMetadata"
              class="hidden"
            >
              <source src="../../../../input/audio.opus" type="audio/ogg">
            </audio>
          </div>
        </template>
      </Card>

      <!-- Instructions Card -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-xl text-primary"></i>
            <span class="text-lg font-semibold">Hướng dẫn sử dụng</span>
          </div>
        </template>
        <template #content>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-center gap-2">
              <i class="pi pi-play text-primary"></i>
              <span>Ấn nút play để phát âm thanh. Khi đang phát sẽ hiển thị nút pause</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-bookmark text-primary"></i>
              <span>Âm thanh phát đến đâu, từ sẽ được highlight đến đó</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-sliders-h text-primary"></i>
              <span>Kéo slider để tua nhanh, đồng thời đồng bộ lại highlight</span>
            </li>
          </ul>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
import Card from 'primevue/card'
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'

export default {
  name: 'App',
  components: {
    Card,
    Button,
    Slider,
    Avatar,
    Badge
  },
  data() {
    return {
      subtitles: [],
      timestamps: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      currentHighlight: null
    }
  },
  async mounted() {
    try {
      // Đọc file subtitles
      const subtitlesResponse = await fetch('../../../../output/output_AB.txt');
      const subtitlesText = await subtitlesResponse.text();
      this.subtitles = subtitlesText.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          speaker: line.charAt(0),
          text: line.substring(3)
        }));

      // Đọc file timestamps
      const timestampsResponse = await fetch('../../../../output/timestamp.txt');
      const timestampsText = await timestampsResponse.text();
      this.timestamps = timestampsText.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [time, duration, index, length] = line.split(',').map(Number);
          return { time, duration, index, length };
        });
    } catch (error) {
      console.error('Error loading files:', error);
    }
  },
  methods: {
    togglePlay() {
      const audio = this.$refs.audioPlayer;
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },
    onTimeUpdate(event) {
      this.currentTime = event.target.currentTime * 1000;
      this.updateHighlight();
    },
    onLoadedMetadata(event) {
      this.duration = event.target.duration * 1000;
    },
    onSliderChange() {
      const audio = this.$refs.audioPlayer;
      audio.currentTime = this.currentTime / 1000;
      this.updateHighlight();
    },
    updateHighlight() {
      const timestamp = this.timestamps.find(t => 
        this.currentTime >= t.time && 
        this.currentTime <= (t.time + t.duration)
      );
      this.currentHighlight = timestamp;
    },
    getHighlightedText(text, lineIndex) {
      if (!this.currentHighlight) return text;
      
      const highlight = this.currentHighlight;
      const start = highlight.index;
      const end = start + highlight.length;

      return text.split('').map((char, index) => {
        if (index >= start && index < end) {
          return `<span class="bg-yellow-300 transition-colors duration-200">${char}</span>`;
        }
        return char;
      }).join('');
    },
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style>
:root {
  --primary-color: #2196F3;
  --secondary-color: #FF4081;
}

.p-card {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
}

.p-slider .p-slider-range {
  background: var(--primary-color) !important;
}

.p-slider .p-slider-handle {
  border-color: var(--primary-color) !important;
  transition: transform 0.2s ease;
}

.p-slider .p-slider-handle:hover {
  transform: scale(1.2);
}

.bg-primary {
  background-color: var(--primary-color) !important;
}

.bg-secondary {
  background-color: var(--secondary-color) !important;
}

.text-primary {
  color: var(--primary-color) !important;
}

.highlight-text {
  background-color: #FFF176;
  transition: background-color 0.3s ease;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease;
}
</style>