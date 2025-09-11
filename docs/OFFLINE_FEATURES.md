# Offline Features Documentation

## Overview
This document outlines the offline capabilities of the RentSmart application, including how they work and how to use them effectively.

## Service Worker

The service worker (`public/sw.js`) handles offline functionality with the following features:

### Caching Strategy
- **Static Assets**: Caches all static assets (HTML, CSS, JS, images) on install
- **API Responses**: Uses Network-First strategy for API calls, falling back to cache when offline
- **Dynamic Content**: Caches dynamic content with configurable TTL (Time To Live)

### Cache Configuration
```javascript
const CACHE_CONFIG = {
  // Cache successful GET requests for these paths
  cacheablePaths: [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    /\.[a-z0-9]+\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
  ],
  
  // Don't cache these paths
  blacklist: [
    '/sockjs-node',
    '/api',
    '/socket.io',
  ],
  
  // Cache API responses separately
  apiCacheName: 'rentsmart-api',
  
  // Cache version (increment to force cache refresh)
  version: 'v1',
};
```

## Offline Data Management

The `useOfflineData` hook provides offline data persistence and synchronization:

### Features
- Automatic queuing of mutations when offline
- Automatic sync when connection is restored
- Conflict resolution for concurrent modifications
- Configurable retry logic for failed syncs

### Usage Example
```javascript
const { data, addItem, updateItem, removeItem, syncWithServer } = useOfflineData('todos');

// Add an item (will be queued if offline)
const handleAdd = async (newItem) => {
  const result = await addItem(newItem);
  // Item will have _offline: true if queued
};

// Manually trigger sync
const handleSync = async () => {
  await syncWithServer();
};
```

## API Service

The API service (`src/services/api.js`) has been enhanced with offline support:

### Offline Features
- Automatic request queuing when offline
- Response caching for GET requests
- Retry logic for failed requests
- Background sync for queued requests

### Usage
```javascript
// Standard API call (works offline)
const { data, loading, error } = useApi(
  () => api.get('/todos'),
  { initialData: [] }
);

// Mutation with offline support
const [createTodo] = useMutation(
  (newTodo) => api.post('/todos', newTodo),
  {
    // This will be called when offline
    onOffline: (newTodo) => {
      // Add to local cache immediately
      queryClient.setQueryData('todos', old => [...old, { ...newTodo, _offline: true }]);
    },
    // This will be called when syncing
    onSync: (response) => {
      // Update local cache with server response
      queryClient.setQueryData('todos', old => 
        old.map(item => 
          item._offlineId === response._offlineId 
            ? { ...response, _offline: false }
            : item
        )
      );
    }
  }
);
```

## Testing Offline Functionality

### Manual Testing
1. Open Chrome DevTools (F12)
2. Go to the "Application" tab
3. Select "Service Workers" in the sidebar
4. Check "Offline" to simulate offline mode
5. Test the application's behavior

### Automated Tests
Run the test suite with:
```bash
pnpm test
```

## Best Practices

1. **Data Validation**: Always validate data before syncing with the server
2. **Conflict Resolution**: Implement conflict resolution for concurrent edits
3. **User Feedback**: Show clear indicators when working offline
4. **Storage Limits**: Be mindful of localStorage and Cache API quotas
5. **Error Handling**: Provide meaningful error messages for failed syncs

## Troubleshooting

### Common Issues
1. **Cached content not updating**:
   - Increment the cache version in `CACHE_CONFIG`
   - Clear application storage in DevTools

2. **Offline queue not syncing**:
   - Check for console errors
   - Verify the service worker is registered correctly
   - Ensure the sync event listener is properly set up

3. **Missing assets when offline**:
   - Check the `PRECACHE_ASSETS` array in `sw.js`
   - Verify all required assets are being cached during install

## Mobile Optimization

### Touch Targets
- Ensure all interactive elements are at least 48x48px
- Add sufficient spacing between touch targets
- Use `touch-action: manipulation` for better touch response

### Performance
- Optimize images and assets
- Use lazy loading for below-the-fold content
- Implement skeleton loaders for better perceived performance

### PWA Features
- Add to home screen prompt
- Splash screen customization
- Offline fallback pages
