// Import the jest-dom library for custom matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock the global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock the online/offline status
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
  configurable: true
});

// Mock the fetch API
global.fetch = vi.fn();

// Mock the ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub;

// Mock the IntersectionObserver
class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserverStub;

// Mock the scrollIntoView method
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock the scrollTo method
window.scrollTo = vi.fn();

// Mock the Notification API
Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    ...options,
    close: vi.fn(),
  })),
  writable: true,
});

// Mock the service worker registration
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    addEventListener: vi.fn(),
    ready: Promise.resolve({
      register: vi.fn(),
    }),
  },
  writable: true,
});

// Mock the indexedDB for testing
const mockIndexedDB = {
  open: vi.fn().mockImplementation(() => ({
    onupgradeneeded: null,
    onerror: null,
    onsuccess: null,
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn(),
      }),
    },
  })),
};

window.indexedDB = mockIndexedDB;
