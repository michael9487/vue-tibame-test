<script setup>
import { ref, onMounted } from 'vue'


// 圖片陣列
const cards = ref([
  { id: 1, img: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600' },
  { id: 2, img: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600' }
])

const canvasRefs = ref([])
const pi = x => x * Math.PI / 180
// const function pi(x){
//  x * Math.PI / 180
//} 

function draw(canvasElement, long, Camera, radius, imageSrc) {
  const canvas = canvasElement; 
  if (!canvas) return;
  
  const context = canvas.getContext('2d');
  
  canvas.width = long;
  canvas.height = long;

  const img = new Image();

  
  img.onload = () => {
    context.clearRect(0, 0, long, long);
    
    context.beginPath();
    context.arc(radius, radius, radius, pi(180), pi(270));
    context.arc(long - radius, radius, radius, pi(270), pi(0));
    context.arc(long - radius, long - Camera - radius, radius, pi(0), pi(90));
    context.arc(long - Camera + radius, long - Camera + radius, radius, pi(270), pi(180), true);
    context.arc(long - Camera - radius, long - radius, radius, pi(0), pi(90));
    context.arc(radius, long - radius, radius, pi(90), pi(180));
    context.closePath();

    context.save(); 
    context.clip(); 
    context.drawImage(img, 0, 0, long, long);
    context.restore(); 
  }

  img.src = imageSrc; 
}

onMounted(() => {
  // 遍歷每一個 Canvas DOM 元素並執行繪圖
  // canvasRefs.value 是一個陣列，裡面裝著所有的 canvas 元素
  canvasRefs.value.forEach((canvasEl, index) => {
    const imageUrl = cards.value[index].img;
    draw(canvasEl, 280, 70, 32, imageUrl);
  })
})
</script>

<template>
  <div class="product-case">
    <div 
      v-for="(card, index) in cards" 
      :key="card.id" 
      class="product-card"
    >
      <canvas 
        :ref="(el) => canvasRefs[index] = el" 
        class="myCanvas"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
  .product-case {
    display: flex;
    gap: 8px;
  }
  .product-card{
    width: 300px;
    height: 300px;
    background-color: #ccc;
    position: relative;
    border-radius: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .myCanvas{
    transition: all 1s;
  }
  .product-card:hover .myCanvas{
    transform: scale(1.1);
  }
</style>