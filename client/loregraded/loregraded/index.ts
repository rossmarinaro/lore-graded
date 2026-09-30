// index.js (At the absolute root directory)
import { registerRootComponent } from 'expo';
import AppScreen from './src/app/index';

// Explicitly points the entry tree directly to your master React view
registerRootComponent(AppScreen);
