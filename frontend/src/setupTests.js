import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });
Object.defineProperty(window, 'matchMedia', { writable: true, value: jest.fn().mockImplementation(query => ({ matches: true, media: query, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() })) });
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.scrollTo = jest.fn();

Object.defineProperty(globalThis, 'crypto', { value: require('crypto').webcrypto, configurable: true });
