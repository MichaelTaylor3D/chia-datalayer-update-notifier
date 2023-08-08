# Chia Datalayer Update Notifier

This module provides a utility to watch Chia Datalayer stores for changes in their root hashes. When a root hash changes, it signifies that the store has been updated. The module then notifies all registered callbacks of the updated store, enabling quick actions based on these changes.

## Features

1. **Watch Store Updates**: Continuously monitors the root hashes of registered Chia datalayer stores to detect updates.
2. **Callback Notifications**: In the event of a store update, all registered callbacks are notified of the storeId that has been updated.
3. **Flexible Configuration**: Easily adjustable settings to suit different environments.

## Installation

To use this module, ensure you have the required dependencies installed:

```bash
npm install chia-datalayer-update-notifier
```

### Example

```
const datalayerNotifier = require('./index');

datalayerNotifier.registerStore("179fd363...400f999c44b");

datalayerNotifier.startWatcher(storeId => {
  console.log('Store was updated: ', storeId);
});
```

## Usage

Here's an overview of the module's API:

### `configure(newConfig)`

Allows you to provide custom configuration settings to the module.

- `newConfig`: A configuration object. Can be a partial configuration.

### `registerStore(storeId)`

Registers a store by its ID for monitoring. The root hash of the given store will be watched for any changes.

- `storeId`: ID of the store to register.

### `unregisterStore(storeId)`

Unregisters a store by its ID. This stops the module from monitoring changes for this particular store.

- `storeId`: ID of the store to unregister.

### `startWatcher(callback)`

Initiates the root hash watcher. The provided callback will be notified whenever a change in a root hash is detected for any registered store.

- `callback`: A function to call when a root hash change is detected.

### `stopWatcher(callback)`

Unregisters a previously registered callback. If no callbacks are left, the watcher is stopped.

- `callback`: The callback function to unregister.

## Configuration

The default configuration is stored in `defaultConfig.js`:

```javascript
module.exports = {
  datalayer_host: "https://localhost:8562",
  certificate_folder_path: "~/.chia/mainnet/config/ssl",
  check_for_update_interval: 2 * 60 * 1000, // 2 minutes
};
```

- `datalayer_host`: The host URL for the Chia datalayer.
- `certificate_folder_path`: Path to the Chia certificate folder.
- `check_for_update_interval`: Interval at which the watcher checks for root hash changes in registered stores.

## Contribution

Contributions to this project are welcome! Submit issues or pull requests for improvements, enhancements, and bug fixes. Ensure your code adheres to the established style and includes tests for any new features.

## Support

If you find this project useful, please consider supporting our work. You can send contributions to the following Chia address:

```
xch17edp36nd9m5jfcq2sa5qp25ekrrfguvpx05zce35pf65mlvfn4gqyl0434
```

Your support is greatly appreciated!