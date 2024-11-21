const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// 在游戏对象声明前添加响应式设置
let canvasWidth = 800;
let canvasHeight = 600;

// 设置画布大小的函数
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerWidth = container.clientWidth;
    
    // 设置最大宽度
    canvasWidth = Math.min(containerWidth - 20, 800);
    canvasHeight = canvasWidth * 0.75; // 保持 4:3 的比例

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 根据新的画布大小调整游戏参数
    bird.radius = canvasWidth * 0.0375; // 相对大小
    bird.x = canvasWidth * 0.125;
    bird.y = canvasHeight * 0.5;
    bird.gravity = canvasHeight * 0.0008; // 降低重力
    bird.jump = -canvasHeight * 0.015; // 调整跳跃力度
}

// 游戏对象
const bird = {
    x: 50,
    y: 200,
    radius: 15,
    speed: 0,
    gravity: 0.5,
    jump: -8
};

const walls = [];
let score = 0;
let gameOver = false;
const meteors = [];

// 创建墙壁
function createWall() {
    const gap = canvasHeight * 0.4; // 增加间隙
    const wallWidth = canvasWidth * 0.075;
    const minHeight = canvasHeight * 0.1;
    const maxHeight = canvasHeight - gap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    walls.push({
        x: canvasWidth,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        width: wallWidth,
        passed: false
    });
}

// 更新游戏状态
function update() {
    if (gameOver) return;

    // 更新小鸟位置
    bird.speed += bird.gravity;
    bird.y += bird.speed;

    // 检查小鸟是否撞到地面或天花板 - 这种情况游戏结束
    if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
        gameOver = true;
        return;
    }

    // 更新壁位置
    for (let i = walls.length - 1; i >= 0; i--) {
        walls[i].x -= canvasWidth * 0.003; // 使用相对速度

        // 检查碰撞 - 撞墙只是反弹，不会结束游戏
        if (checkCollision(bird, walls[i])) {
            // 碰撞后将小鸟位置固定在初始位置
            bird.x = 50;
        }

        // 计算得分
        if (!walls[i].passed && walls[i].x + walls[i].width < bird.x) {
            walls[i].passed = true;
            score++;
            scoreElement.textContent = `得分：${score}`;
        }

        // 删除离开屏幕的墙壁
        if (walls[i].x + walls[i].width < 0) {
            walls.splice(i, 1);
        }
    }

    // 添加新墙壁
    if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - canvasWidth * 0.4) {
        createWall();
    }
}

// 检查碰撞
function checkCollision(bird, wall) {
    if (bird.x + bird.radius > wall.x && bird.x - bird.radius < wall.x + wall.width) {
        if (bird.y - bird.radius < wall.topHeight || bird.y + bird.radius > wall.bottomY) {
            return true;
        }
    }
    return false;
}

// 流星类
class Meteor {
    constructor(startX) {
        this.reset(startX);
    }

    reset(startX = null) {
        this.x = startX !== null ? startX : Math.random() * canvasWidth;
        this.y = -20 - Math.random() * canvasHeight; // 增加初始高度范围
        this.speed = canvasWidth * 0.002 + Math.random() * (canvasWidth * 0.002); // 降低速度
        this.length = canvasWidth * 0.03 + Math.random() * (canvasWidth * 0.04);
        this.angle = Math.PI / 4;
        this.opacity = 0.2 + Math.random() * 0.5; // 降低不透明度
    }

    update() {
        this.x += this.speed;
        this.y += this.speed;

        // 如果流星超出画布，重置位置
        if (this.y > canvas.height || this.x > canvas.width) {
            this.reset(0); // 从左边重新开始
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x - this.length * Math.cos(this.angle),
            this.y - this.length * Math.sin(this.angle)
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - this.length * Math.cos(this.angle),
            this.y - this.length * Math.sin(this.angle)
        );
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }
}

// 在游戏开始前初始化流星
function initMeteors() {
    meteors.length = 0;
    const meteorCount = Math.floor(canvasWidth / 20); // 增加流星数量
    
    // 创建更多的流星，均匀分布在整个画布上
    for (let i = 0; i < meteorCount; i++) {
        const startX = (canvasWidth / meteorCount) * i;
        const meteor = new Meteor(startX);
        meteor.y = Math.random() * canvasHeight; // 随机分布在整个画布高度
        meteors.push(meteor);
    }
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景色（可选）
    ctx.fillStyle = '#000033'; // 深蓝色背景
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新和绘制流星
    meteors.forEach(meteor => {
        meteor.update();
        meteor.draw();
    });

    // 绘制小猪
    // 绘制小猪身体
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB6C1'; // 粉色
    ctx.fill();
    ctx.closePath();

    // 绘制小猪鼻子
    ctx.beginPath();
    ctx.arc(bird.x + bird.radius - 5, bird.y, bird.radius/3, 0, Math.PI * 2);
    ctx.fillStyle = '#FF69B4'; // 深粉色
    ctx.fill();
    ctx.closePath();

    // 绘制小猪眼睛
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();

    // 绘制墙壁
    ctx.fillStyle = 'green';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, 0, wall.width, wall.topHeight);
        ctx.fillRect(wall.x, wall.bottomY, wall.width, canvas.height - wall.bottomY);
    });

    // 显示游戏结束
    if (gameOver) {
        ctx.fillStyle = 'white'; // 改为白色让它在深色背景上更显眼
        ctx.font = '30px Arial';
        ctx.fillText('游戏结束！', canvas.width/2 - 70, canvas.height/2);
    }
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 处理点击/按键事件
function jump() {
    if (!gameOver) {
        bird.speed = bird.jump;
    } else {
        // 重置游戏
        bird.y = 200;
        bird.speed = 0;
        walls.length = 0;
        score = 0;
        scoreElement.textContent = `得分：${score}`;
        gameOver = false;
    }
}

// 添加事件监听器
canvas.addEventListener('click', jump);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        jump();
    }
});

// 在游戏开始前添加窗口大小改变事件监听
window.addEventListener('resize', () => {
    resizeCanvas();
    initMeteors();
});

// 添加触摸事件支持
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 防止页面滚动
    jump();
});

// 在游戏开始前初始化画布大小
resizeCanvas();
initMeteors();

// 开始游戏
gameLoop(); 