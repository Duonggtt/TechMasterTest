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
              v-for="(line, lineIndex) in subtitleLines" 
              :key="lineIndex"
              class="flex items-start gap-3 p-3 rounded-lg transition-all"
              :class="line.speaker === 'A' ? 'bg-blue-50' : 'bg-pink-50'"
            >
              <Avatar 
                :icon="line.speaker === 'A' ? 'pi pi-user' : 'pi pi-users'"
                :class="line.speaker === 'A' ? 'bg-primary' : 'bg-secondary'"
                shape="circle"
              />
              
              <div class="flex-1">
                <Badge 
                  :value="line.speaker === 'A' ? 'James' : 'Lan'"
                  :severity="line.speaker === 'A' ? 'info' : 'warning'"
                  class="mb-2"
                />
                <p 
                  class="text-lg leading-relaxed"
                  :class="line.speaker === 'A' ? 'text-blue-800' : 'text-pink-600'"
                  v-html="getHighlightedText(line.text, lineIndex)"
                ></p>
              </div>
            </div>
          </div>

          <!-- Audio Controls -->
          <div class="bg-white p-4 rounded-lg shadow-sm">
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

            <Slider
              v-model="currentTime"
              :min="0"
              :max="duration"
              @change="onSliderChange"
              class="w-full"
            />

            <audio 
              ref="audioPlayer" 
              @timeupdate="onTimeUpdate"
              @loadedmetadata="onLoadedMetadata"
              class="hidden"
            >
              <source :src="`${apiBaseUrl}/audio`" type="audio/ogg">
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

const SILENCE_THRESHOLD = 500 // ms - ngưỡng cho khoảng im lặng
const WORD_GAP_THRESHOLD = 300 // ms - ngưỡng cho khoảng cách giữa các từ

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
      apiBaseUrl: 'http://localhost:3000/api',
      subtitleLines: [],
      timestamps: [],
      words: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      currentHighlight: null
    }
  },
  async mounted() {
    try {
      // Đọc subtitles
      const subtitlesResponse = await fetch(`${this.apiBaseUrl}/subtitles`)
      if (!subtitlesResponse.ok) throw new Error('Failed to load subtitles')
      const subtitlesText = await subtitlesResponse.text()
      
      // Xử lý subtitles
      this.subtitleLines = subtitlesText.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          speaker: line[0],
          text: line.slice(3).trim()
        }))

      // Tạo mảng words và tính toán vị trí
      let wordIndex = 0
      this.words = []
      
      this.subtitleLines.forEach((line, lineIndex) => {
        const words = line.text.split(/\s+/)
        words.forEach(word => {
          this.words.push({
            text: word,
            lineIndex,
            index: wordIndex++
          })
        })
      })

      // Đọc timestamps
      const timestampsResponse = await fetch(`${this.apiBaseUrl}/timestamps`)
      if (!timestampsResponse.ok) throw new Error('Failed to load timestamps')
      const timestampsText = await timestampsResponse.text()
      
      // Debug log
      console.log('Raw timestamps:', timestampsText)
      
      // Xử lý timestamps
      let lastEndTime = 0
      const allTimestamps = timestampsText.split('\n')
        .filter(line => line.trim())
        .map((line, index) => {
          const [time, duration] = line.split(',').map(Number)
          const word = this.words[index % this.words.length]
          
          if (!word) return null

          // Kiểm tra khoảng dừng
          const isPause = time - lastEndTime > 500 // 500ms là ngưỡng pause
          lastEndTime = time + duration

          return {
            time,
            duration,
            text: word.text,
            lineIndex: word.lineIndex,
            index: word.index,
            endTime: time + duration,
            isPause
          }
        })
        .filter(t => t !== null)

      // Sắp xếp timestamps theo thời gian
      this.timestamps = allTimestamps.sort((a, b) => a.time - b.time)

    } catch (error) {
      console.error('Initialization error:', error)
    }
  },
  methods: {
    updateHighlight() {
      const currentMs = this.currentTime
      
      // Tìm từ hiện tại dựa trên timestamps
      const currentWord = this.timestamps.find((timestamp, index) => {
        // Lấy timestamp tiếp theo để xác định khoảng thời gian giữa các từ
        const nextTimestamp = this.timestamps[index + 1]
        
        // Kiểm tra xem thời gian hiện tại có nằm trong khoảng của từ này
        // hoặc trong khoảng giữa từ này và từ tiếp theo
        if (nextTimestamp) {
          return currentMs >= timestamp.time && currentMs < nextTimestamp.time
        } else {
          // Nếu là từ cuối cùng
          return currentMs >= timestamp.time && 
                currentMs < (timestamp.time + timestamp.duration)
        }
      })

      // Chỉ cập nhật khi có từ mới
      if (currentWord?.text !== this.currentHighlight?.text) {
        this.currentHighlight = currentWord
        
        if (currentWord) {
          console.log('Current highlight:', {
            time: currentMs,
            text: currentWord.text,
            lineIndex: currentWord.lineIndex,
            duration: currentWord.duration,
            wordStart: currentWord.time,
            wordEnd: currentWord.time + currentWord.duration
          })
        }
      }
    },

    onTimeUpdate(event) {
      this.currentTime = Math.round(event.target.currentTime * 1000)
      this.updateHighlight()
    },

    beforeDestroy() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
      }
    },

    getHighlightedText(text, lineIndex) {
      if (!this.currentHighlight || this.currentHighlight.lineIndex !== lineIndex) {
        return text
      }

      const words = text.split(/\s+/)
      return words.map(word => 
        word === this.currentHighlight.text ? 
          `<mark class="highlight-text">${word}</mark>` : 
          word
      ).join(' ')
    },

    onLoadedMetadata(event) {
      this.duration = Math.floor(event.target.duration * 1000)
      console.log('Audio duration:', this.duration)
    },

    onSliderChange() {
      const audio = this.$refs.audioPlayer
      audio.currentTime = this.currentTime / 1000
      this.updateHighlight()
    },

    togglePlay() {
      const audio = this.$refs.audioPlayer
      if (this.isPlaying) {
        audio.pause()
      } else {
        audio.play().catch(error => {
          console.error('Error playing audio:', error)
        })
      }
      this.isPlaying = !this.isPlaying
    },

    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
  background-color: #fef08a;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

@keyframes highlight-pulse {
  0% { background-color: #fef08a; }
  50% { background-color: #fde047; }
  100% { background-color: #fef08a; }
}
</style>