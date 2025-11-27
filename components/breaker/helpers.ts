import { Ball, Block, Paddle, PowerUp } from './types';

// Block Colors
export const BLOCK_COLORS: { [key: string]: string } = {
  '1': '#00f3ff', // neon-blue
  '2': '#9d00ff', // neon-purple
  '3': '#ff00ff', // neon-pink
};
export const INDESTRUCTIBLE_COLOR = '#4b5563'; // gray-600

export function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle, canvasHeight: number) {
  ctx.beginPath();
  const y = canvasHeight - 40; // Paddle position from bottom
  ctx.rect(paddle.x, y, paddle.width, paddle.height);
  ctx.fillStyle = '#f5f5f5'; // white
  ctx.shadowColor = '#f5f5f5';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.closePath();
  // Reset shadow for other elements
  ctx.shadowBlur = 0;
}

export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe600'; // neon-yellow
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

export function drawBlocks(ctx: CanvasRenderingContext2D, blocks: Block[]) {
  blocks.forEach(block => {
    ctx.beginPath();
    ctx.rect(block.x, block.y, block.width, block.height);
    ctx.fillStyle = block.color;
    ctx.shadowColor = block.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.closePath();
  });
  ctx.shadowBlur = 0;
}

export function createParticles(particles: any[], x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            life: 30, // frames
            color: color,
        });
    }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: any[]) {
    particles.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) {
            particles.splice(index, 1);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.fill();
            ctx.closePath();
        }
    });
    ctx.globalAlpha = 1.0;
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp) {
    const { x, y, width, height, type } = powerUp;
    let color = '#fff';
    let text = '';

    switch (type) {
        case 'PADDLE_GROW': color = '#22c55e'; text = '+'; break;
        case 'PADDLE_SHRINK': color = '#ef4444'; text = '-'; break;
        case 'MULTI_BALL': color = '#3b82f6'; text = 'MB'; break;
        case 'BALL_FAST': color = '#ec4899'; text = 'F'; break;
        case 'BALL_SLOW': color = '#06b6d4'; text = 'S'; break;
        case 'EXTRA_LIFE': color = '#facc15'; text = '♥'; break;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - width / 2, y - height / 2, width, height);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}