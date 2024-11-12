// Основні налаштування сцени, камери та рендерера
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Генерація частинок
const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    particlePositions[i] = (Math.random() - 0.5) * 10;
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Завантаження кількох зображень
const textureLoader = new THREE.TextureLoader();
const images = [
    textureLoader.load('./images/gogh.jpg'),
    textureLoader.load('./images/magritt.jpg'),
    textureLoader.load('./images/klimt.jpg'),
    // Додайте інші зображення тут
];

// Створюємо спрайт, який буде показувати вибране зображення
const imageMaterial = new THREE.SpriteMaterial();
const imageSprite = new THREE.Sprite(imageMaterial);
imageSprite.scale.set(1, 1, 1); // Початковий розмір
imageSprite.visible = false; // Спочатку приховуємо
scene.add(imageSprite);

// Ініціалізація переміщень частинок (velocities)
const velocities = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
    velocities[i] = (Math.random() - 0.5) * 0.02; // Випадкова швидкість для кожної координати частинки
}

function getMaxScale() {
    const maxWidth = window.innerWidth * 0.9; // 90% ширини екрану
    const maxHeight = window.innerHeight * 0.9; // 90% висоти екрану

    const imageAspectRatio = imageMaterial.map.image.width / imageMaterial.map.image.height;
    const screenAspectRatio = maxWidth / maxHeight;

    let scale = 1;
    if (imageAspectRatio > screenAspectRatio) {
        scale = maxWidth / imageMaterial.map.image.width;
    } else {
        scale = maxHeight / imageMaterial.map.image.height;
    }
    return scale;
}

// Подія кліку на частинку
function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(particleSystem);
    
    if (intersects.length > 0) {
        // Випадкове зображення з масиву
        const randomImage = images[Math.floor(Math.random() * images.length)];
        
        // Встановлюємо текстуру вибраного зображення
        imageMaterial.map = randomImage;
        imageMaterial.needsUpdate = true;

        // Позиціонуємо спрайт на місці натиснутої частинки
        imageSprite.position.copy(intersects[0].point);
        imageSprite.scale.set(1, 1, 1); // Початковий розмір картинки
        imageSprite.visible = true;

        // Анімація збільшення картинки
        const animateImage = () => {
            if (imageSprite.scale.x < 1) {
                imageSprite.scale.x += 0.05;
                imageSprite.scale.y += 0.05;
                requestAnimationFrame(animateImage);
            }
        };
        animateImage();
    }
}

// Подія для дотику на мобільних пристроях
function onTouchStart(event) {
    event.preventDefault(); // щоб запобігти скролінгу сторінки
    const touch = event.touches[0];
    const mouse = new THREE.Vector2();
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(particleSystem);

    if (intersects.length > 0) {
        // Випадкове зображення з масиву
        const randomImage = images[Math.floor(Math.random() * images.length)];

        // Встановлюємо текстуру вибраного зображення
        imageMaterial.map = randomImage;
        imageMaterial.needsUpdate = true;

        // Позиціонуємо спрайт на місці натиснутої частинки
        imageSprite.position.copy(intersects[0].point);
        imageSprite.scale.set(1, 1, 1); // Початковий розмір картинки
        imageSprite.visible = true;

        // Анімація збільшення картинки
        const animateImage = () => {
            if (imageSprite.scale.x < 0.5) {
                imageSprite.scale.x += 0.01;
                imageSprite.scale.y += 0.01;
                requestAnimationFrame(animateImage);
            }
        };
        animateImage();
    }
}

window.addEventListener('click', onMouseClick);
window.addEventListener('touchstart', onTouchStart);

// Додаємо обробку подій для руху миші
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove);

// Анімація сцени
function animate() {
    requestAnimationFrame(animate);

    // Оновлення позицій частинок для хаотичного руху
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] += velocities[i];

        // Обмеження руху частинок у певному діапазоні
        if (positions[i] > 5 || positions[i] < -5) {
            velocities[i] = -velocities[i];
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Реакція частинок на мишку
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(particleSystem);
    if (intersects.length > 0) {
        const particle = intersects[0];
        for (let i = 0; i < particleCount; i++) {
            const dx = positions[i * 3] - particle.point.x;
            const dy = positions[i * 3 + 1] - particle.point.y;
            const dz = positions[i * 3 + 2] - particle.point.z;

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 1) {
                positions[i * 3] += dx * 0.1;
                positions[i * 3 + 1] += dy * 0.1;
                positions[i * 3 + 2] += dz * 0.1;
            }
        }
    }

    renderer.render(scene, camera);
}

// Масштабування для адаптації під розмір вікна
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();


