const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Завантаження кількох зображень
const textureLoader = new THREE.TextureLoader();
const images = [
    textureLoader.load('./images/gogh.jpg'),
    textureLoader.load('./images/magritt.jpg'),
    textureLoader.load('./images/klimt.jpg'),
    // Додайте сюди інші зображення
];

const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

// Генерація частинок
for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 10;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    particles.userData = particles.userData || [];
    particles.userData[i] = { imageIndex: i % images.length };
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Створюємо спрайт, який буде показувати вибране зображення
const imageMaterial = new THREE.SpriteMaterial();
const imageSprite = new THREE.Sprite(imageMaterial);
imageSprite.visible = false;  // Спочатку невидиме
scene.add(imageSprite);

// Змінні для анімації
let animationFrameId = null;

// Масштабування зображення по кліку
const animateImage = () => {
    const maxScaleX = window.innerWidth * 0.9 / imageSprite.scale.x; // 90% ширини екрану
    const maxScaleY = window.innerHeight * 0.9 / imageSprite.scale.y; // 90% висоти екрану

    // Перевіряємо, чи зображення ще не досягло обмежень
    if (imageSprite.scale.x < maxScaleX && imageSprite.scale.y < maxScaleY) {
        imageSprite.scale.x += 0.05; // Збільшуємо по осі X
        imageSprite.scale.y += 0.05; // Збільшуємо по осі Y
    } else {
        // Якщо максимальний розмір досягнуто, зупиняємо анімацію
        imageSprite.scale.x = maxScaleX;
        imageSprite.scale.y = maxScaleY;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Якщо анімація ще триває, запустимо її знову
    if (animationFrameId !== null) {
        animationFrameId = requestAnimationFrame(animateImage);
    }
};

// Подія кліку на частинку
function onMouseClick(event) {
    // Оновлюємо координати миші
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Якщо є активна анімація, зупиняємо її
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Перевіряємо перехрестя миші з частинками
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(particleSystem);

    if (intersects.length > 0) {
        const intersectedParticle = intersects[0];
        const particleIndex = intersectedParticle.index; // Отримуємо індекс частинки

        // Отримуємо індекс зображення з userData
        const imageIndex = particles.userData[particleIndex].imageIndex;
        const selectedImage = images[imageIndex];

        // Встановлюємо вибране зображення для спрайта
        imageMaterial.map = selectedImage;
        imageMaterial.needsUpdate = true;

        // Позиціонуємо і анімуємо зображення
        imageSprite.position.copy(intersectedParticle.point);
        imageSprite.scale.set(1, 1, 1); // Початковий розмір
        imageSprite.visible = true;

        // Запускаємо анімацію
        animationFrameId = requestAnimationFrame(animateImage);
    }
}

window.addEventListener('click', onMouseClick);

const velocities = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
    velocities[i] = (Math.random() - 0.5) * 0.02; // Випадкова швидкість для кожної координати частинки
}

// Додаємо обробку подій для руху миші
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove);

// Подія для дотику на мобільних пристроях
function onTouchMove(event) {
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('touchmove', onTouchMove);

// Анімація сцени
function animate() {
    requestAnimationFrame(animate);

    // Оновлення позицій частинок для хаотичного руху
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] += velocities[i];

        // Обмеження руху частинок у певному діапазоні, щоб не вилітали занадто далеко
        if (positions[i] > 5 || positions[i] < -5) {
            velocities[i] = -velocities[i]; // Міняємо напрямок, якщо частинка досягла межі
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

