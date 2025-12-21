
import { ServerConfig } from './types';

// World Configuration
export const WORLD_SIZE = 4000; 
export const INITIAL_LENGTH = 15;
export const SEGMENT_DISTANCE = 5; 
export const BASE_SPEED = 4.5; 
export const BOOST_SPEED = 9.5; 
export const TURN_SPEED = 0.18; 
export const JOYSTICK_DEADZONE = 3; 

// Entities Configuration
export const BOT_COUNT = 50; 
export const INITIAL_FOOD_COUNT = 1500; 
export const MIN_FOOD_REGEN = 1000;

export const COLORS = ['#00f3ff', '#ff00ff', '#9d00ff', '#ffe600', '#00ff9d', '#ff4d4d', '#ff9f43'];

export const SERVERS: ServerConfig[] = [
    { id: 'slither_main', name: 'NEON CITY (EU)', region: 'Europe', max: 50, ping: 45 },
    { id: 'slither_us', name: 'SOLAR DUST (US)', region: 'USA', max: 50, ping: 120 }, 
];

export const calculateWormRadius = (score: number) => {
    return 12 + Math.min(48, Math.sqrt(score) * 0.4);
};
